"""
Appointments Blueprint
Handles appointment booking and management
"""

from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from datetime import datetime
import secrets
import string
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from app.models.database import Database, get_users_collection, get_access_permissions_collection, get_records_collection
from app.utils.auth import require_auth
from app.utils.audit import log_action

bp = Blueprint('appointments', __name__, url_prefix='/api/appointments')


def get_appointments_collection():
    """Get appointments collection"""
    return Database.get_collection('appointments')


def generate_appointment_id():
    """
    Generate a unique appointment ID
    Format: APT-XXXXXXXX (8 random alphanumeric characters)
    """
    appointments_collection = get_appointments_collection()
    
    max_attempts = 20
    for _ in range(max_attempts):
        # Generate 8-character random alphanumeric string
        characters = string.ascii_uppercase + string.digits
        random_part = ''.join(secrets.choice(characters) for _ in range(8))
        appointment_id = f"APT-{random_part}"
        
        # Check if ID already exists
        existing = appointments_collection.find_one({'appointment_id': appointment_id})
        if not existing:
            return appointment_id
    
    # If we couldn't generate a unique ID after max_attempts, raise an error
    raise ValueError(f"Could not generate unique appointment ID after {max_attempts} attempts")


@bp.route('/search-doctors', methods=['POST'])
@require_auth
def search_doctors():
    """Search for doctors by ID or specialization"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        doctor_id = data.get('doctor_id', '').strip()
        specialization = data.get('specialization', '').strip()
        
        # Build query
        query = {
            'role': 'doctor',
            'is_verified': True,
            'is_active': True,
            'is_profile_complete': True
        }
        
        if doctor_id:
            query['doctor_id'] = doctor_id
        
        if specialization:
            query['specialization'] = specialization
        
        # Find doctors
        doctors = list(users_collection.find(query).limit(20))
        
        # Format results
        results = []
        for doctor in doctors:
            results.append({
                '_id': str(doctor['_id']),
                'doctor_id': doctor.get('doctor_id'),
                'full_name': doctor.get('full_name'),
                'specialization': doctor.get('specialization'),
                'years_of_experience': doctor.get('years_of_experience'),
                'qualification': doctor.get('qualification'),
                'hospital_affiliation': doctor.get('hospital_affiliation'),
                'consultation_fee': doctor.get('consultation_fee'),
                'languages_spoken': doctor.get('languages_spoken', []),
                'bio': doctor.get('bio'),
                'profile_photo': doctor.get('profile_photo'),
                'address': doctor.get('address'),
                'phone': doctor.get('phone')
            })
        
        return jsonify({
            'doctors': results,
            'count': len(results)
        }), 200
    
    except Exception as e:
        print(f"Search doctors error: {e}")
        return jsonify({'error': 'Failed to search doctors'}), 500


@bp.route('/book', methods=['POST'])
@require_auth
def book_appointment():
    """Book an appointment with a doctor"""
    try:
        appointments_collection = get_appointments_collection()
        access_collection = get_access_permissions_collection()
        users_collection = get_users_collection()
        
        if appointments_collection is None or access_collection is None or users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        doctor_id = data.get('doctor_id')
        appointment_date = data.get('appointment_date')
        appointment_time = data.get('appointment_time')
        reason = data.get('reason', '')
        
        if not all([doctor_id, appointment_date, appointment_time]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        patient_id = request.user['user_id']
        
        # Verify doctor exists
        doctor = users_collection.find_one({
            '_id': ObjectId(doctor_id),
            'role': 'doctor',
            'is_verified': True
        })
        
        if not doctor:
            return jsonify({'error': 'Doctor not found or not verified'}), 404
        
        # Generate unique appointment ID
        appointment_id = generate_appointment_id()
        
        # Generate 6-digit OTP for appointment verification
        verification_otp = ''.join(secrets.choice(string.digits) for _ in range(6))
        
        # Create appointment
        appointment = {
            'appointment_id': appointment_id,
            'patient_id': ObjectId(patient_id),
            'doctor_id': ObjectId(doctor_id),
            'appointment_date': appointment_date,
            'appointment_time': appointment_time,
            'reason': reason,
            'status': 'pending',  # pending, confirmed, completed, cancelled
            'verification_otp': verification_otp,
            'otp_verified': False,
            'prescription': None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = appointments_collection.insert_one(appointment)
        
        # NOTE: Access is NOT automatically granted
        # Doctor must approve the appointment first
        
        # Log the action
        log_action(patient_id, 'book_appointment', 'appointment', str(result.inserted_id))
        
        return jsonify({
            'message': 'Appointment request sent successfully. Waiting for doctor approval.',
            'appointment_id': appointment_id,
            '_id': str(result.inserted_id)
        }), 201
    
    except Exception as e:
        print(f"Book appointment error: {e}")
        return jsonify({'error': 'Failed to book appointment'}), 500


@bp.route('/my-appointments', methods=['GET'])
@require_auth
def get_my_appointments():
    """Get all appointments for the current user"""
    try:
        appointments_collection = get_appointments_collection()
        users_collection = get_users_collection()
        
        if appointments_collection is None or users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        role = request.user['role']
        
        # Build query based on role
        if role == 'patient':
            query = {'patient_id': ObjectId(user_id)}
        elif role == 'doctor':
            query = {'doctor_id': ObjectId(user_id)}
        else:
            return jsonify({'error': 'Invalid role'}), 403
        
        # Get appointments
        appointments = list(appointments_collection.find(query).sort('appointment_date', -1))
        
        # Populate with user details
        results = []
        for apt in appointments:
            # Get other party details
            if role == 'patient':
                other_user = users_collection.find_one({'_id': apt['doctor_id']})
                other_key = 'doctor'
            else:
                other_user = users_collection.find_one({'_id': apt['patient_id']})
                other_key = 'patient'
            
            user_info = {
                'full_name': other_user.get('full_name') if other_user else 'Unknown',
                'email': other_user.get('email') if other_user else ''
            }
            
            # Add extra info for patient viewing doctor
            if role == 'patient' and other_user:
                user_info.update({
                    'specialization': other_user.get('specialization'),
                    'hospital': other_user.get('hospital_affiliation'),
                    'address': other_user.get('address')
                })
            elif role == 'doctor' and other_user:
                user_info['specialization'] = None
            
            results.append({
                '_id': str(apt['_id']),
                'appointment_id': apt.get('appointment_id', 'N/A'),
                'appointment_date': apt['appointment_date'],
                'appointment_time': apt['appointment_time'],
                'reason': apt.get('reason', ''),
                'status': apt['status'],
                'verification_otp': apt.get('verification_otp') if role == 'patient' else None,
                'otp_verified': apt.get('otp_verified', False),
                'prescription': apt.get('prescription'),
                'created_at': apt['created_at'].isoformat(),
                other_key: user_info
            })
        
        return jsonify({
            'appointments': results,
            'count': len(results)
        }), 200
    
    except Exception as e:
        print(f"Get appointments error: {e}")
        return jsonify({'error': 'Failed to fetch appointments'}), 500


@bp.route('/<appointment_id>/approve', methods=['POST'])
@require_auth
def approve_appointment(appointment_id):
    """Approve an appointment (doctor only)"""
    try:
        appointments_collection = get_appointments_collection()
        access_collection = get_access_permissions_collection()
        
        if appointments_collection is None or access_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Only doctors can approve
        if request.user['role'] != 'doctor':
            return jsonify({'error': 'Only doctors can approve appointments'}), 403
        
        appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check if this is the doctor's appointment
        user_id = request.user['user_id']
        if str(appointment['doctor_id']) != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Update appointment status
        appointments_collection.update_one(
            {'_id': ObjectId(appointment_id)},
            {'$set': {'status': 'confirmed', 'updated_at': datetime.utcnow()}}
        )
        
        # Grant doctor access to patient records
        patient_id = appointment['patient_id']
        doctor_id = appointment['doctor_id']
        
        existing_permission = access_collection.find_one({
            'patient_id': patient_id,
            'doctor_id': doctor_id
        })
        
        if not existing_permission:
            permission = {
                'patient_id': patient_id,
                'doctor_id': doctor_id,
                'permission_level': 'read',
                'granted_at': datetime.utcnow()
            }
            access_collection.insert_one(permission)
        
        # Log the action
        log_action(user_id, 'approve_appointment', 'appointment', appointment_id)
        
        return jsonify({'message': 'Appointment approved successfully. You now have access to patient records.'}), 200
    
    except Exception as e:
        print(f"Approve appointment error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to approve appointment'}), 500


@bp.route('/<appointment_id>/reject', methods=['POST'])
@require_auth
def reject_appointment(appointment_id):
    """Reject an appointment (doctor only)"""
    try:
        appointments_collection = get_appointments_collection()
        if appointments_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Only doctors can reject
        if request.user['role'] != 'doctor':
            return jsonify({'error': 'Only doctors can reject appointments'}), 403
        
        appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check if this is the doctor's appointment
        user_id = request.user['user_id']
        if str(appointment['doctor_id']) != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Update status
        appointments_collection.update_one(
            {'_id': ObjectId(appointment_id)},
            {'$set': {'status': 'rejected', 'updated_at': datetime.utcnow()}}
        )
        
        # Log the action
        log_action(user_id, 'reject_appointment', 'appointment', appointment_id)
        
        return jsonify({'message': 'Appointment rejected successfully'}), 200
    
    except Exception as e:
        print(f"Reject appointment error: {e}")
        return jsonify({'error': 'Failed to reject appointment'}), 500


@bp.route('/<appointment_id>/cancel', methods=['POST'])
@require_auth
def cancel_appointment(appointment_id):
    """Cancel an appointment"""
    try:
        appointments_collection = get_appointments_collection()
        if appointments_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check permissions
        user_id = request.user['user_id']
        if str(appointment['patient_id']) != user_id and str(appointment['doctor_id']) != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Update status
        appointments_collection.update_one(
            {'_id': ObjectId(appointment_id)},
            {'$set': {'status': 'cancelled', 'updated_at': datetime.utcnow()}}
        )
        
        # Log the action
        log_action(user_id, 'cancel_appointment', 'appointment', appointment_id)
        
        return jsonify({'message': 'Appointment cancelled successfully'}), 200
    
    except Exception as e:
        print(f"Cancel appointment error: {e}")
        return jsonify({'error': 'Failed to cancel appointment'}), 500


@bp.route('/<appointment_id>/reactivate', methods=['POST'])
@require_auth
def reactivate_appointment(appointment_id):
    """Reactivate a cancelled appointment (patient only)"""
    try:
        appointments_collection = get_appointments_collection()
        if appointments_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Only patient can reactivate
        user_id = request.user['user_id']
        if str(appointment['patient_id']) != user_id:
            return jsonify({'error': 'Only patients can reactivate their appointments'}), 403
        
        # Can only reactivate cancelled appointments
        if appointment['status'] != 'cancelled':
            return jsonify({'error': 'Only cancelled appointments can be reactivated'}), 400
        
        # Check if appointment date is still in the future
        apt_date = datetime.strptime(appointment['appointment_date'], '%Y-%m-%d')
        if apt_date.date() < datetime.utcnow().date():
            return jsonify({'error': 'Cannot reactivate past appointments'}), 400
        
        # Reactivate to pending status
        appointments_collection.update_one(
            {'_id': ObjectId(appointment_id)},
            {'$set': {'status': 'pending', 'updated_at': datetime.utcnow()}}
        )
        
        # Log the action
        log_action(user_id, 'reactivate_appointment', 'appointment', appointment_id)
        
        return jsonify({'message': 'Appointment reactivated successfully. Waiting for doctor approval.'}), 200
    
    except Exception as e:
        print(f"Reactivate appointment error: {e}")
        return jsonify({'error': 'Failed to reactivate appointment'}), 500


@bp.route('/<appointment_id>/verify-otp', methods=['POST'])
@require_auth
def verify_appointment_otp(appointment_id):
    """Verify appointment OTP (doctor only)"""
    try:
        appointments_collection = get_appointments_collection()
        if appointments_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Only doctors can verify OTP
        if request.user['role'] != 'doctor':
            return jsonify({'error': 'Only doctors can verify OTP'}), 403
        
        data = request.get_json()
        otp = data.get('otp', '').strip()
        
        if not otp:
            return jsonify({'error': 'OTP is required'}), 400
        
        appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check if this is the doctor's appointment
        user_id = request.user['user_id']
        if str(appointment['doctor_id']) != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if appointment is confirmed
        if appointment['status'] != 'confirmed':
            return jsonify({'error': 'Appointment must be confirmed first'}), 400
        
        # Verify OTP
        if appointment.get('verification_otp') != otp:
            return jsonify({'error': 'Invalid OTP'}), 400
        
        # Mark OTP as verified
        appointments_collection.update_one(
            {'_id': ObjectId(appointment_id)},
            {'$set': {'otp_verified': True, 'updated_at': datetime.utcnow()}}
        )
        
        # Log the action
        log_action(user_id, 'verify_appointment_otp', 'appointment', appointment_id)
        
        return jsonify({'message': 'OTP verified successfully. You can now add prescription.'}), 200
    
    except Exception as e:
        print(f"Verify OTP error: {e}")
        return jsonify({'error': 'Failed to verify OTP'}), 500


def generate_prescription_pdf(prescription_data, patient_data, doctor_data, appointment_data):
    """Generate a professional PDF prescription document and return as bytes"""
    try:
        # Generate filename based on diagnosis
        safe_diagnosis = "".join(c for c in prescription_data['diagnosis'] if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_diagnosis = safe_diagnosis.replace(' ', '_')[:50]  # Limit length
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"Prescription_{safe_diagnosis}_{timestamp}.pdf"
        
        print(f"📄 Generating PDF: {filename}")
        
        # Create PDF in memory using BytesIO
        from io import BytesIO
        pdf_buffer = BytesIO()
        
        # Create PDF with margins
        doc = SimpleDocTemplate(
            pdf_buffer, 
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch
        )
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles with better formatting
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=20,
            spaceBefore=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=13,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=10,
            spaceBefore=15,
            fontName='Helvetica-Bold',
            borderWidth=0,
            borderPadding=5,
            borderColor=colors.HexColor('#3b82f6'),
            borderRadius=3,
            backColor=colors.HexColor('#eff6ff')
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            spaceAfter=8
        )
        
        # Header with title
        story.append(Paragraph("℞ MEDICAL PRESCRIPTION", title_style))
        story.append(Spacer(1, 0.15*inch))
        
        # Horizontal line
        from reportlab.platypus import HRFlowable
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#3b82f6'), spaceAfter=15))
        
        # Doctor Information Section
        story.append(Paragraph("PRESCRIBED BY", heading_style))
        doctor_info = [
            ['Doctor:', f"Dr. {doctor_data.get('full_name', 'N/A')}"],
            ['Specialization:', doctor_data.get('specialization', 'General Physician')],
            ['Hospital/Clinic:', doctor_data.get('hospital_affiliation', 'N/A')],
            ['Date:', datetime.fromisoformat(prescription_data['prescribed_at']).strftime('%d %B %Y')]
        ]
        doctor_table = Table(doctor_info, colWidths=[1.5*inch, 4.5*inch])
        doctor_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0'))
        ]))
        story.append(doctor_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Patient Information Section
        story.append(Paragraph("PATIENT INFORMATION", heading_style))
        
        # Calculate age from date of birth if age is not available
        age_display = patient_data.get('age', 'N/A')
        if age_display == 'N/A' or not age_display:
            dob = patient_data.get('date_of_birth')
            if dob:
                try:
                    if isinstance(dob, str):
                        dob_date = datetime.fromisoformat(dob.replace('Z', '+00:00'))
                    else:
                        dob_date = dob
                    today = datetime.now()
                    age_display = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
                except:
                    age_display = 'N/A'
        
        patient_info = [
            ['Patient Name:', patient_data.get('full_name', 'N/A')],
            ['Patient ID:', patient_data.get('patient_id', patient_data.get('_id', 'N/A'))],
            ['Age / Gender:', f"{age_display} years / {patient_data.get('gender', 'N/A')}"],
            ['Blood Group:', patient_data.get('blood_group', 'N/A')]
        ]
        patient_table = Table(patient_info, colWidths=[1.5*inch, 4.5*inch])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0'))
        ]))
        story.append(patient_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Diagnosis Section
        story.append(Paragraph("DIAGNOSIS", heading_style))
        diagnosis_text = prescription_data['diagnosis'].replace('\n', '<br/>')
        story.append(Paragraph(diagnosis_text, normal_style))
        story.append(Spacer(1, 0.15*inch))
        
        # Medications Section
        story.append(Paragraph("PRESCRIBED MEDICATIONS", heading_style))
        med_data = [['#', 'Medication & Dosage Instructions']]
        
        for idx, med in enumerate(prescription_data['medications'], 1):
            # Clean up medication text
            med_clean = med.strip()
            # Remove markdown formatting
            med_clean = med_clean.replace('**', '').replace('*', '')
            med_data.append([str(idx), med_clean])
        
        med_table = Table(med_data, colWidths=[0.4*inch, 5.6*inch])
        med_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('ALIGN', (1, 0), (1, 0), 'LEFT'),
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            # Padding
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            # Grid and colors
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
        ]))
        story.append(med_table)
        story.append(Spacer(1, 0.2*inch))
        
        # Instructions Section
        if prescription_data.get('instructions'):
            story.append(Paragraph("CARE INSTRUCTIONS", heading_style))
            # Clean up instructions text
            instructions_text = prescription_data['instructions']
            # Remove excessive asterisks and clean formatting
            instructions_text = instructions_text.replace('**', '').replace('* *', '')
            # Split into bullet points if it contains line breaks
            if '\n' in instructions_text:
                instructions_lines = [line.strip() for line in instructions_text.split('\n') if line.strip()]
                for line in instructions_lines:
                    # Remove leading asterisks or dashes
                    line = line.lstrip('*-• ').strip()
                    if line:
                        story.append(Paragraph(f"• {line}", normal_style))
            else:
                story.append(Paragraph(instructions_text, normal_style))
            story.append(Spacer(1, 0.15*inch))
        
        # Next Checkup / Follow-up Section
        if prescription_data.get('next_checkup'):
            story.append(Paragraph("FOLLOW-UP & TESTS", heading_style))
            checkup_text = prescription_data['next_checkup'].replace('\n', '<br/>')
            story.append(Paragraph(checkup_text, normal_style))
            story.append(Spacer(1, 0.15*inch))
        
        # Important Notes Box
        notes_style = ParagraphStyle(
            'Notes',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#dc2626'),
            backColor=colors.HexColor('#fef2f2'),
            borderWidth=1,
            borderColor=colors.HexColor('#dc2626'),
            borderPadding=8,
            borderRadius=3
        )
        story.append(Paragraph("<b>⚠ IMPORTANT:</b> Take medications as prescribed. Do not stop or change dosage without consulting your doctor. Contact immediately if you experience any adverse reactions.", notes_style))
        
        # Footer
        story.append(Spacer(1, 0.3*inch))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceBefore=10, spaceAfter=10))
        
        footer_style = ParagraphStyle(
            'Footer', 
            parent=styles['Normal'], 
            fontSize=8, 
            textColor=colors.HexColor('#64748b'), 
            alignment=TA_CENTER,
            leading=10
        )
        story.append(Paragraph("This is a digitally generated prescription from BharathMedicare Healthcare System", footer_style))
        story.append(Paragraph(f"Prescription ID: {appointment_data.get('appointment_id', 'N/A')} | Generated: {datetime.now().strftime('%d %B %Y, %I:%M %p')}", footer_style))
        story.append(Paragraph("For verification, contact the prescribing doctor or hospital", footer_style))
        
        # Build PDF
        doc.build(story)
        
        # Get PDF bytes
        pdf_bytes = pdf_buffer.getvalue()
        pdf_buffer.close()
        
        print(f"✅ PDF generated successfully: {len(pdf_bytes)} bytes")
        
        return filename, pdf_bytes
        
    except Exception as e:
        print(f"PDF generation error: {e}")
        import traceback
        traceback.print_exc()
        raise


@bp.route('/<appointment_id>/prescription', methods=['POST'])
@require_auth
def add_prescription(appointment_id):
    """Add prescription to appointment (doctor only, after OTP verification)"""
    try:
        appointments_collection = get_appointments_collection()
        users_collection = get_users_collection()
        records_collection = get_records_collection()
        
        if appointments_collection is None or users_collection is None or records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Only doctors can add prescriptions
        if request.user['role'] != 'doctor':
            return jsonify({'error': 'Only doctors can add prescriptions'}), 403
        
        data = request.get_json()
        diagnosis = data.get('diagnosis', '').strip()
        medications = data.get('medications', [])
        instructions = data.get('instructions', '').strip()
        next_checkup = data.get('next_checkup', '').strip()
        
        if not diagnosis or not medications:
            return jsonify({'error': 'Diagnosis and medications are required'}), 400
        
        appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check if this is the doctor's appointment
        user_id = request.user['user_id']
        if str(appointment['doctor_id']) != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Check if OTP is verified
        if not appointment.get('otp_verified', False):
            return jsonify({'error': 'Please verify OTP first'}), 400
        
        # Get doctor and patient details
        doctor = users_collection.find_one({'_id': ObjectId(user_id)})
        patient = users_collection.find_one({'_id': appointment['patient_id']})
        
        # Create prescription
        prescription = {
            'diagnosis': diagnosis,
            'medications': medications,
            'instructions': instructions,
            'next_checkup': next_checkup,
            'prescribed_by': {
                'doctor_id': user_id,
                'doctor_name': doctor.get('full_name'),
                'specialization': doctor.get('specialization')
            },
            'prescribed_at': datetime.utcnow().isoformat()
        }
        
        # Generate PDF
        filename, pdf_bytes = generate_prescription_pdf(
            prescription, 
            patient, 
            doctor,
            appointment
        )
        
        # Encrypt the PDF bytes
        from app.utils.encryption import encrypt_file_data
        encryption_result = encrypt_file_data(pdf_bytes)
        
        if not encryption_result['success']:
            return jsonify({'error': 'Failed to encrypt prescription PDF'}), 500
        
        # Save prescription PDF as medical record (encrypted in database)
        medical_record = {
            'patient_id': appointment['patient_id'],
            'file_name': filename,
            'file_type': 'application/pdf',
            'file_size': len(pdf_bytes),
            'description': f"Prescription - {diagnosis}",
            'uploaded_at': datetime.utcnow(),
            'uploaded_by': 'system',
            'is_prescription': True,
            'is_deleted': False,
            'appointment_id': appointment_id,
            'encrypted_data': encryption_result['encrypted_data'],
            'encryption_metadata': {'method': encryption_result['encryption_method']}
        }
        
        result = records_collection.insert_one(medical_record)
        print(f"✅ Prescription PDF saved to medical records: {filename}")
        print(f"✅ Record ID: {result.inserted_id}")
        print(f"✅ File size: {len(pdf_bytes)} bytes (encrypted and stored in MongoDB)")
        
        # Update appointment with prescription and mark as completed
        appointments_collection.update_one(
            {'_id': ObjectId(appointment_id)},
            {
                '$set': {
                    'prescription': prescription,
                    'prescription_file': filename,
                    'status': 'completed',
                    'updated_at': datetime.utcnow()
                }
            }
        )
        
        # Log the action
        log_action(user_id, 'add_prescription', 'appointment', appointment_id)
        
        return jsonify({
            'message': 'Prescription added successfully and saved to patient medical records',
            'prescription': prescription,
            'prescription_file': filename
        }), 200
    
    except Exception as e:
        print(f"Add prescription error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to add prescription'}), 500


@bp.route('/<appointment_id>', methods=['DELETE'])
@require_auth
def delete_appointment(appointment_id):
    """Delete an appointment from history (only cancelled, rejected, or completed)"""
    try:
        appointments_collection = get_appointments_collection()
        if appointments_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        appointment = appointments_collection.find_one({'_id': ObjectId(appointment_id)})
        
        if not appointment:
            return jsonify({'error': 'Appointment not found'}), 404
        
        # Check permissions - only patient or doctor involved can delete
        user_id = request.user['user_id']
        if str(appointment['patient_id']) != user_id and str(appointment['doctor_id']) != user_id:
            return jsonify({'error': 'Access denied'}), 403
        
        # Can only delete cancelled, rejected, or completed appointments
        if appointment['status'] not in ['cancelled', 'rejected', 'completed']:
            return jsonify({'error': 'Can only delete cancelled, rejected, or completed appointments'}), 400
        
        # Delete the appointment
        appointments_collection.delete_one({'_id': ObjectId(appointment_id)})
        
        # Log the action
        log_action(user_id, 'delete_appointment', 'appointment', appointment_id)
        
        return jsonify({'message': 'Appointment deleted successfully'}), 200
    
    except Exception as e:
        print(f"Delete appointment error: {e}")
        return jsonify({'error': 'Failed to delete appointment'}), 500
