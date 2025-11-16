"""
Clinical Decision Support API Blueprint
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
from app.models.database import Database
from app.utils.auth import require_auth
from app.ai_cds import CDSEngine

bp = Blueprint('cds', __name__, url_prefix='/api/cds')

# Initialize CDS Engine
db = Database.get_db()
cds_engine = CDSEngine(db)


@bp.route('/analyze', methods=['POST'])
@require_auth
def analyze_patient():
    """
    Ambient CDS analysis endpoint
    Analyzes patient context and provides suggestions
    """
    try:
        data = request.get_json()
        
        patient_id = data.get('patient_id')
        context_data = data.get('context', {})
        trigger_type = data.get('trigger_type', 'passive')
        
        if not patient_id:
            return jsonify({'success': False, 'error': 'patient_id is required'}), 400
        
        # Only doctors can use CDS
        if request.user.get('role') != 'doctor':
            return jsonify({'success': False, 'error': 'CDS is only available for physicians'}), 403
        
        physician_id = request.user.get('user_id')
        
        print(f"🔍 CDS Analysis Request: patient_id={patient_id}, trigger={trigger_type}")
        
        # Perform CDS analysis
        suggestions = cds_engine.analyze_and_suggest(
            patient_id=patient_id,
            physician_id=physician_id,
            context_data=context_data,
            trigger_type=trigger_type
        )
        
        if 'error' in suggestions:
            print(f"❌ CDS Error: {suggestions['error']}")
            return jsonify({'success': False, 'error': suggestions['error']}), 400
        
        print(f"✅ CDS Analysis Success: {len(suggestions.get('differential_diagnosis', []))} diagnoses, {len(suggestions.get('medication_recommendations', []))} medications")
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        print(f"❌ CDS Exception: {str(e)}")
        return jsonify({'success': False, 'error': f'Analysis failed: {str(e)}'}), 500


@bp.route('/medication-safety', methods=['POST'])
@require_auth
def check_medication_safety():
    """
    Check medication safety including interactions, allergies, contraindications
    """
    try:
        data = request.get_json()
        
        patient_id = data.get('patient_id')
        medication = data.get('medication')
        dose = data.get('dose')
        
        if not patient_id or not medication:
            return jsonify({'error': 'patient_id and medication are required'}), 400
        
        # Only doctors can check medication safety
        if request.user.get('role') != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        # Perform safety check
        safety_report = cds_engine.check_medication_safety(
            patient_id=patient_id,
            medication=medication,
            dose=dose
        )
        
        if 'error' in safety_report:
            return jsonify(safety_report), 400
        
        return jsonify({
            'success': True,
            'safety_report': safety_report
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Safety check failed: {str(e)}'}), 500


@bp.route('/feedback', methods=['POST'])
@require_auth
def record_feedback():
    """
    Record physician feedback on CDS suggestions
    Enables learning and personalization
    """
    try:
        data = request.get_json()
        
        suggestion_id = data.get('suggestion_id')
        suggestion_type = data.get('suggestion_type')
        suggestion_content = data.get('suggestion_content')
        action = data.get('action')  # 'accepted', 'dismissed', 'modified'
        reason = data.get('reason')
        
        if not all([suggestion_type, suggestion_content, action]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if action not in ['accepted', 'dismissed', 'modified']:
            return jsonify({'error': 'Invalid action'}), 400
        
        # Only doctors can provide feedback
        if request.user.get('role') != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        physician_id = request.user.get('user_id')
        
        # Record feedback
        success = cds_engine.record_physician_feedback(
            physician_id=physician_id,
            suggestion_id=suggestion_id,
            suggestion_type=suggestion_type,
            suggestion_content=suggestion_content,
            action=action,
            reason=reason
        )
        
        if not success:
            return jsonify({'error': 'Failed to record feedback'}), 500
        
        return jsonify({
            'success': True,
            'message': 'Feedback recorded successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to record feedback: {str(e)}'}), 500


@bp.route('/preferences', methods=['GET'])
@require_auth
def get_preferences():
    """
    Get physician's learned preferences
    """
    try:
        if request.user.get('role') != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        physician_id = request.user.get('user_id')
        
        preferences = cds_engine.learning_system.get_physician_preferences(physician_id)
        
        return jsonify({
            'success': True,
            'preferences': preferences
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get preferences: {str(e)}'}), 500


@bp.route('/preferences', methods=['PUT'])
@require_auth
def update_preferences():
    """
    Update physician preferences (e.g., suggestion frequency)
    """
    try:
        if request.user.get('role') != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        physician_id = request.user.get('user_id')
        
        # Update preferences in database
        db.physician_preferences.update_one(
            {'physician_id': ObjectId(physician_id)},
            {
                '$set': {
                    'suggestion_frequency': data.get('suggestion_frequency', 'normal'),
                    'updated_at': datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return jsonify({
            'success': True,
            'message': 'Preferences updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update preferences: {str(e)}'}), 500


@bp.route('/analytics', methods=['GET'])
@require_auth
def get_analytics():
    """
    Get CDS usage analytics for physician
    """
    try:
        if request.user.get('role') != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        physician_id = request.user.get('user_id')
        days = request.args.get('days', 30, type=int)
        
        analytics = cds_engine.learning_system.get_feedback_analytics(physician_id, days)
        
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get analytics: {str(e)}'}), 500


@bp.route('/differential-diagnosis', methods=['POST'])
@require_auth
def get_differential_diagnosis():
    """
    Get differential diagnosis for symptoms
    """
    try:
        if request.user.get('role') != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        patient_id = data.get('patient_id')
        
        if not symptoms:
            return jsonify({'error': 'symptoms are required'}), 400
        
        # Get patient context if patient_id provided
        patient_context = {}
        if patient_id:
            patient_context = cds_engine.context_analyzer.analyze_patient_context(patient_id)
        
        # Get differential diagnosis
        ddx_list = cds_engine.knowledge_base.get_differential_diagnosis(symptoms, patient_context)
        
        # Filter based on physician preferences
        physician_id = request.user.get('user_id')
        ddx_list = cds_engine.learning_system.filter_suggestions(
            physician_id, ddx_list, 'differential_diagnosis'
        )
        
        return jsonify({
            'success': True,
            'differential_diagnosis': ddx_list
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate DDx: {str(e)}'}), 500


@bp.route('/guidelines/<topic>', methods=['GET'])
@require_auth
def get_guideline(topic):
    """
    Get clinical guideline for a topic
    """
    try:
        guideline = cds_engine.knowledge_base.get_clinical_guideline(topic)
        
        if not guideline:
            return jsonify({'error': 'Guideline not found'}), 404
        
        return jsonify({
            'success': True,
            'guideline': guideline
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get guideline: {str(e)}'}), 500


@bp.route('/ai-enhance-diagnosis', methods=['POST'])
@require_auth
def ai_enhance_diagnosis():
    """
    Get AI-enhanced differential diagnosis using Gemini AI
    """
    try:
        if request.user.get('role') != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        patient_id = data.get('patient_id')
        
        if not symptoms:
            return jsonify({'error': 'symptoms are required'}), 400
        
        # Get patient context
        patient_context = {}
        if patient_id:
            patient_context = cds_engine.context_analyzer.analyze_patient_context(patient_id)
        
        # Get AI-enhanced diagnosis
        ai_result = cds_engine.gemini_ai.enhance_differential_diagnosis(symptoms, patient_context)
        
        if not ai_result:
            return jsonify({'error': 'AI enhancement unavailable'}), 503
        
        return jsonify({
            'success': True,
            'ai_diagnosis': ai_result
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'AI enhancement failed: {str(e)}'}), 500


# Commented out - these endpoints require methods not available in Gemini AI
# Can be re-enabled if needed by implementing equivalent methods in gemini_integration.py

# @bp.route('/ai-treatment-guidelines/<condition>', methods=['GET'])
# @require_auth
# def get_ai_treatment_guidelines(condition):
#     """Get latest treatment guidelines"""
#     pass

# @bp.route('/ai-clinical-question', methods=['POST'])
# @require_auth
# def answer_clinical_question():
#     """Answer clinical questions"""
#     pass

# @bp.route('/ai-literature-search', methods=['POST'])
# @require_auth
# def search_medical_literature():
#     """Search medical literature"""
#     pass


@bp.route('/save-prescription', methods=['POST'])
@require_auth
def save_prescription():
    """
    Save prescription as PDF to patient medical records
    """
    try:
        if request.user.get('role') != 'doctor':
            return jsonify({'error': 'Only doctors can save prescriptions'}), 403
        
        data = request.get_json()
        patient_id = data.get('patient_id')
        prescription = data.get('prescription', {})
        
        if not patient_id or not prescription:
            return jsonify({'error': 'patient_id and prescription are required'}), 400
        
        # Validate prescription data
        diagnosis = prescription.get('diagnosis', '').strip()
        medications = prescription.get('medications', [])
        
        if not diagnosis or not medications:
            return jsonify({'error': 'Diagnosis and medications are required'}), 400
        
        # Get patient and doctor details
        users_collection = Database.get_collection('users')
        records_collection = Database.get_collection('records')
        
        patient = users_collection.find_one({'_id': ObjectId(patient_id)})
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
        
        doctor_id = request.user.get('user_id')
        doctor = users_collection.find_one({'_id': ObjectId(doctor_id)})
        if not doctor:
            return jsonify({'error': 'Doctor not found'}), 404
        
        # Import PDF generation function from appointments blueprint
        from app.blueprints.appointments import generate_prescription_pdf
        
        # Prepare prescription data for PDF generation
        prescription_data = {
            'diagnosis': diagnosis,
            'medications': medications,
            'instructions': prescription.get('instructions', ''),
            'next_checkup': prescription.get('next_checkup', ''),
            'prescribed_at': datetime.utcnow().isoformat()
        }
        
        # Create mock appointment data for PDF generation
        appointment_data = {
            'appointment_id': f'CDS-{datetime.now().strftime("%Y%m%d%H%M%S")}',
            'created_via': 'Clinical Decision Support System'
        }
        
        # Generate PDF
        filename, pdf_bytes = generate_prescription_pdf(
            prescription_data,
            patient,
            doctor,
            appointment_data
        )
        
        # Encrypt the PDF
        from app.utils.encryption import encrypt_file_data
        encryption_result = encrypt_file_data(pdf_bytes)
        
        if not encryption_result['success']:
            return jsonify({'error': 'Failed to encrypt prescription PDF'}), 500
        
        # Save to medical records
        medical_record = {
            'patient_id': ObjectId(patient_id),
            'file_name': filename,
            'file_type': 'application/pdf',
            'file_size': len(pdf_bytes),
            'description': f"Prescription - {diagnosis}",
            'uploaded_at': datetime.utcnow(),
            'uploaded_by': 'doctor',
            'doctor_id': ObjectId(doctor_id),
            'is_prescription': True,
            'is_deleted': False,
            'encrypted_data': encryption_result['encrypted_data'],
            'encryption_metadata': {'method': encryption_result['encryption_method']},
            'prescription_details': prescription_data
        }
        
        result = records_collection.insert_one(medical_record)
        
        print(f"✅ Prescription PDF saved: {filename}")
        print(f"✅ Record ID: {result.inserted_id}")
        print(f"✅ File size: {len(pdf_bytes)} bytes")
        
        return jsonify({
            'success': True,
            'message': 'Prescription saved successfully to patient medical records',
            'filename': filename,
            'file_size': len(pdf_bytes),
            'record_id': str(result.inserted_id)
        }), 200
        
    except Exception as e:
        print(f"Save prescription error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to save prescription: {str(e)}'}), 500


@bp.route('/ai-generate-treatment', methods=['POST'])
@require_auth
def ai_generate_treatment():
    """
    Generate comprehensive treatment plan using knowledge base
    """
    try:
        if request.user.get('role') != 'doctor':
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        # Extract patient context
        symptoms = data.get('symptoms', '')
        diagnosis = data.get('diagnosis', '')
        vitals = data.get('vitals', {})
        chronic_conditions = data.get('chronic_conditions', [])
        allergies = data.get('allergies', [])
        current_medications = data.get('current_medications', [])
        age = data.get('age', 'Unknown')
        gender = data.get('gender', 'Unknown')
        
        if not symptoms and not diagnosis:
            return jsonify({'error': 'Either symptoms or diagnosis is required'}), 400
        
        # Try Gemini AI first, fallback to knowledge base
        print(f"🤖 Attempting to generate treatment plan with Gemini AI...")
        print(f"Patient data: symptoms={symptoms}, diagnosis={diagnosis}")
        ai_response = cds_engine.gemini_ai.generate_treatment_plan(data)
        print(f"Gemini response: {ai_response is not None}")
        
        if ai_response:
            # Parse Gemini response
            response_text = ai_response.get('content', '')
            
            # Split by sections
            prescription = ''
            care_plan = ''
            
            if 'PRESCRIPTION:' in response_text:
                parts = response_text.split('PRESCRIPTION:')
                if len(parts) > 1:
                    prescription_part = parts[1]
                    if 'CARE PLAN:' in prescription_part:
                        prescription = prescription_part.split('CARE PLAN:')[0].strip()
                        care_plan = prescription_part.split('CARE PLAN:')[1].strip()
                    else:
                        prescription = prescription_part.strip()
            
            if not prescription:
                prescription = response_text[:len(response_text)//2]
                care_plan = response_text[len(response_text)//2:]
            
            return jsonify({
                'success': True,
                'treatment_plan': {
                    'prescription': prescription,
                    'care_plan': care_plan,
                    'generated_at': datetime.utcnow().isoformat(),
                    'ai_model': 'Google Gemini Pro'
                }
            }), 200
        else:
            # Fallback to knowledge base
            prescription = generate_prescription(diagnosis, symptoms, chronic_conditions, allergies, current_medications)
            care_plan = generate_care_plan(diagnosis, symptoms, age, gender, vitals, chronic_conditions)
            
            return jsonify({
                'success': True,
                'treatment_plan': {
                    'prescription': prescription,
                    'care_plan': care_plan,
                    'generated_at': datetime.utcnow().isoformat(),
                    'ai_model': 'Clinical Knowledge Base (Fallback)'
                }
            }), 200
        
    except Exception as e:
        print(f"Treatment generation error: {str(e)}")
        return jsonify({'error': f'Failed to generate treatment plan: {str(e)}'}), 500


def generate_prescription(diagnosis, symptoms, chronic_conditions, allergies, current_medications):
    """Generate prescription based on diagnosis and patient context"""
    prescription_lines = []
    
    # Check for common conditions and generate appropriate prescriptions
    diagnosis_lower = diagnosis.lower() if diagnosis else ''
    symptoms_lower = symptoms.lower() if symptoms else ''
    
    # Diabetes
    if 'diabetes' in diagnosis_lower or 'diabetic' in diagnosis_lower:
        if 'penicillin' not in [a.lower() for a in allergies]:
            prescription_lines.append("1. Metformin 500mg - Take 1 tablet twice daily with meals")
            prescription_lines.append("   Duration: Ongoing (chronic management)")
            prescription_lines.append("   Note: Monitor blood glucose levels regularly")
    
    # Hypertension
    if 'hypertension' in diagnosis_lower or 'high blood pressure' in diagnosis_lower or 'bp' in symptoms_lower:
        prescription_lines.append("2. Lisinopril 10mg - Take 1 tablet once daily in the morning")
        prescription_lines.append("   Duration: Ongoing (chronic management)")
        prescription_lines.append("   Note: Monitor blood pressure regularly")
    
    # Pain/Fever
    if 'pain' in symptoms_lower or 'fever' in symptoms_lower or 'ache' in symptoms_lower:
        if 'aspirin' not in [a.lower() for a in allergies]:
            prescription_lines.append("3. Paracetamol 500mg - Take 1-2 tablets every 6 hours as needed")
            prescription_lines.append("   Duration: 5-7 days or until symptoms resolve")
            prescription_lines.append("   Maximum: 4000mg per day")
    
    # Infection symptoms
    if 'infection' in diagnosis_lower or 'cough' in symptoms_lower or 'fever' in symptoms_lower:
        if 'penicillin' not in [a.lower() for a in allergies]:
            prescription_lines.append("4. Amoxicillin 500mg - Take 1 capsule three times daily")
            prescription_lines.append("   Duration: 7 days (complete full course)")
            prescription_lines.append("   Note: Take with food to reduce stomach upset")
    
    # Allergy warnings
    if allergies:
        prescription_lines.append(f"\n⚠️ ALLERGY ALERT: Patient allergic to {', '.join(allergies)}")
        prescription_lines.append("   Avoid prescribing these medications and related compounds")
    
    # Drug interaction warnings
    if current_medications:
        prescription_lines.append(f"\n📋 Current Medications: {', '.join(current_medications)}")
        prescription_lines.append("   Check for drug interactions before prescribing")
    
    if not prescription_lines:
        prescription_lines.append("Based on the provided information, please conduct a thorough examination")
        prescription_lines.append("and prescribe appropriate medications based on clinical findings.")
    
    return '\n'.join(prescription_lines)


def generate_care_plan(diagnosis, symptoms, age, gender, vitals, chronic_conditions):
    """Generate comprehensive care plan"""
    care_plan_lines = []
    
    diagnosis_lower = diagnosis.lower() if diagnosis else ''
    symptoms_lower = symptoms.lower() if symptoms else ''
    
    # General care instructions
    care_plan_lines.append("TREATMENT PLAN & FOLLOW-UP INSTRUCTIONS")
    care_plan_lines.append("=" * 50)
    care_plan_lines.append("")
    
    # Lifestyle modifications
    care_plan_lines.append("1. LIFESTYLE MODIFICATIONS:")
    if 'diabetes' in diagnosis_lower or chronic_conditions and 'diabetes' in str(chronic_conditions).lower():
        care_plan_lines.append("   • Follow diabetic diet - limit sugar and refined carbohydrates")
        care_plan_lines.append("   • Regular exercise: 30 minutes daily, 5 days per week")
        care_plan_lines.append("   • Monitor blood glucose: Fasting and post-meal readings")
    
    if 'hypertension' in diagnosis_lower or 'blood pressure' in diagnosis_lower:
        care_plan_lines.append("   • Low sodium diet (< 2000mg per day)")
        care_plan_lines.append("   • Regular aerobic exercise")
        care_plan_lines.append("   • Stress management techniques")
        care_plan_lines.append("   • Limit alcohol consumption")
    
    care_plan_lines.append("   • Adequate hydration: 8-10 glasses of water daily")
    care_plan_lines.append("   • Adequate rest: 7-8 hours of sleep per night")
    care_plan_lines.append("")
    
    # Monitoring requirements
    care_plan_lines.append("2. MONITORING & TESTS:")
    care_plan_lines.append("   • Monitor vital signs daily (BP, temperature, pulse)")
    if 'diabetes' in diagnosis_lower:
        care_plan_lines.append("   • Blood glucose monitoring: Fasting and 2 hours post-meal")
        care_plan_lines.append("   • HbA1c test every 3 months")
    care_plan_lines.append("   • Keep a symptom diary")
    care_plan_lines.append("")
    
    # Follow-up schedule
    care_plan_lines.append("3. FOLLOW-UP SCHEDULE:")
    care_plan_lines.append("   • Next appointment: 1 week for medication review")
    care_plan_lines.append("   • Routine follow-up: Every 4-6 weeks")
    care_plan_lines.append("   • Emergency: Contact immediately if symptoms worsen")
    care_plan_lines.append("")
    
    # Warning signs
    care_plan_lines.append("4. WARNING SIGNS - SEEK IMMEDIATE CARE IF:")
    care_plan_lines.append("   • Severe chest pain or difficulty breathing")
    care_plan_lines.append("   • High fever (>103°F) not responding to medication")
    care_plan_lines.append("   • Severe allergic reaction (rash, swelling, difficulty breathing)")
    care_plan_lines.append("   • Symptoms significantly worsen")
    care_plan_lines.append("")
    
    # Patient education
    care_plan_lines.append("5. PATIENT EDUCATION:")
    care_plan_lines.append("   • Take medications as prescribed - do not skip doses")
    care_plan_lines.append("   • Report any side effects immediately")
    care_plan_lines.append("   • Maintain regular follow-up appointments")
    care_plan_lines.append("   • Keep emergency contact numbers readily available")
    
    return '\n'.join(care_plan_lines)
