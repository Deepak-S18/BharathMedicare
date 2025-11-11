"""
Appointments Blueprint
Handles appointment booking and management
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from app.models.database import Database, get_users_collection, get_access_permissions_collection
from app.utils.auth import require_auth
from app.utils.audit import log_action

bp = Blueprint('appointments', __name__, url_prefix='/api/appointments')


def get_appointments_collection():
    """Get appointments collection"""
    return Database.get_collection('appointments')


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
                'bio': doctor.get('bio')
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
        
        # Create appointment
        appointment = {
            'patient_id': ObjectId(patient_id),
            'doctor_id': ObjectId(doctor_id),
            'appointment_date': appointment_date,
            'appointment_time': appointment_time,
            'reason': reason,
            'status': 'pending',  # pending, confirmed, completed, cancelled
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
            'appointment_id': str(result.inserted_id)
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
            
            results.append({
                '_id': str(apt['_id']),
                'appointment_date': apt['appointment_date'],
                'appointment_time': apt['appointment_time'],
                'reason': apt.get('reason', ''),
                'status': apt['status'],
                'created_at': apt['created_at'].isoformat(),
                other_key: {
                    'full_name': other_user.get('full_name') if other_user else 'Unknown',
                    'email': other_user.get('email') if other_user else '',
                    'specialization': other_user.get('specialization') if role == 'patient' else None
                }
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
