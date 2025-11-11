"""
Doctors Blueprint
Handles doctor-specific functionality
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from app.models.database import get_users_collection, get_access_permissions_collection
from app.utils.auth import require_auth

bp = Blueprint('doctors', __name__, url_prefix='/api/doctors')


@bp.route('/doctor-card', methods=['GET'])
@require_auth
def get_doctor_card():
    """Get doctor digital ID card data"""
    try:
        users_collection = get_users_collection()
        access_collection = get_access_permissions_collection()
        
        if users_collection is None or access_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        user_id = request.user['user_id']
        
        # Get user details
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user['role'] != 'doctor':
            return jsonify({'error': 'Only doctors can have doctor cards'}), 403
        
        # Get patient count (doctors with access)
        patient_count = access_collection.count_documents({
            'doctor_id': ObjectId(user_id)
        })
        
        # Create doctor card data
        doctor_card = {
            'doctor_id': user.get('doctor_id', 'N/A'),
            'nmc_uid': user.get('nmc_uid', 'Not assigned'),
            'full_name': user.get('full_name', ''),
            'email': user.get('email', ''),
            'phone': user.get('phone', 'Not provided'),
            'specialization': user.get('specialization', 'Not specified'),
            'qualification': user.get('qualification', 'Not specified'),
            'years_of_experience': user.get('years_of_experience', 0),
            'hospital_affiliation': user.get('hospital_affiliation', 'Not specified'),
            'consultation_fee': user.get('consultation_fee', 0),
            'languages_spoken': user.get('languages_spoken', []),
            'blood_group': user.get('blood_group', 'Not specified'),
            'date_of_birth': user.get('date_of_birth', 'Not specified'),
            'address': user.get('address', 'Not provided'),
            'is_verified': user.get('is_verified', False),
            'member_since': user.get('created_at').isoformat() if user.get('created_at') else '',
            'total_patients': patient_count,
            'qr_data': f"BHARATH_MEDICARE_DOCTOR:{user.get('doctor_id', str(user['_id']))}"
        }
        
        return jsonify({'doctor_card': doctor_card}), 200
    
    except Exception as e:
        print(f"Get doctor card error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to get doctor card'}), 500
