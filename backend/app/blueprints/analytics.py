"""
Analytics Blueprint
Provides analytics and insights for patients, doctors, and admins
"""
from flask import Blueprint, jsonify, request
from app.models.database import Database, get_users_collection, get_records_collection, get_access_permissions_collection
from bson import ObjectId
from datetime import datetime, timedelta
import jwt
import os

bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

def get_user_from_token():
    """Extract user from JWT token"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    try:
        decoded = jwt.decode(token, os.getenv('JWT_SECRET_KEY'), algorithms=['HS256'])
        return decoded
    except:
        return None

@bp.route('/patient/overview', methods=['GET'])
def patient_overview():
    """Get patient analytics overview"""
    user = get_user_from_token()
    if not user or user.get('role') != 'patient':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        db = Database.get_db()
        if db is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        records_collection = db['records']
        permissions_collection = db['access_permissions']
        
        user_id = user['user_id']
        
        # Total records
        total_records = records_collection.count_documents({
            'patient_id': ObjectId(user_id),
            'is_deleted': False
        })
        
        # Records by type
        pdf_records = records_collection.count_documents({
            'patient_id': ObjectId(user_id),
            'file_type': 'application/pdf',
            'is_deleted': False
        })
        
        image_records = total_records - pdf_records
        
        # Doctors with access
        doctors_with_access = permissions_collection.count_documents({
            'patient_id': ObjectId(user_id)
        })
        
        # Recent uploads (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_uploads = records_collection.count_documents({
            'patient_id': ObjectId(user_id),
            'uploaded_at': {'$gte': thirty_days_ago},
            'is_deleted': False
        })
        
        # Upload timeline (last 6 months)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        timeline_data = []
        
        for i in range(6):
            month_start = datetime.utcnow() - timedelta(days=30 * (5 - i))
            month_end = datetime.utcnow() - timedelta(days=30 * (4 - i))
            
            count = records_collection.count_documents({
                'patient_id': ObjectId(user_id),
                'uploaded_at': {'$gte': month_start, '$lt': month_end},
                'is_deleted': False
            })
            
            timeline_data.append({
                'month': month_start.strftime('%b %Y'),
                'count': count
            })
        
        return jsonify({
            'success': True,
            'overview': {
                'total_records': total_records,
                'pdf_records': pdf_records,
                'image_records': image_records,
                'doctors_with_access': doctors_with_access,
                'recent_uploads': recent_uploads,
                'timeline': timeline_data
            }
        }), 200
    
    except Exception as e:
        print(f"Patient overview error: {e}")
        return jsonify({'error': 'Failed to fetch analytics'}), 500

@bp.route('/doctor/overview', methods=['GET'])
def doctor_overview():
    """Get doctor analytics overview"""
    user = get_user_from_token()
    if not user or user.get('role') != 'doctor':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        db = Database.get_db()
        if db is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        permissions_collection = db['access_permissions']
        appointments_collection = db['appointments']
        records_collection = db['records']
        
        user_id = user['user_id']
        
        # Total patients
        total_patients = permissions_collection.count_documents({
            'doctor_id': ObjectId(user_id)
        })
        
        # Appointments statistics
        total_appointments = appointments_collection.count_documents({
            'doctor_id': ObjectId(user_id)
        })
        
        pending_appointments = appointments_collection.count_documents({
            'doctor_id': ObjectId(user_id),
            'status': 'pending'
        })
        
        approved_appointments = appointments_collection.count_documents({
            'doctor_id': ObjectId(user_id),
            'status': 'approved'
        })
        
        # Records accessed (approximate)
        records_accessed = 0
        permissions = list(permissions_collection.find({'doctor_id': ObjectId(user_id)}))
        for perm in permissions:
            count = records_collection.count_documents({
                'patient_id': perm['patient_id'],
                'is_deleted': False
            })
            records_accessed += count
        
        # Patient growth (last 6 months)
        growth_data = []
        for i in range(6):
            month_start = datetime.utcnow() - timedelta(days=30 * (5 - i))
            month_end = datetime.utcnow() - timedelta(days=30 * (4 - i))
            
            count = permissions_collection.count_documents({
                'doctor_id': ObjectId(user_id),
                'granted_at': {'$gte': month_start, '$lt': month_end}
            })
            
            growth_data.append({
                'month': month_start.strftime('%b %Y'),
                'count': count
            })
        
        return jsonify({
            'success': True,
            'overview': {
                'total_patients': total_patients,
                'total_appointments': total_appointments,
                'pending_appointments': pending_appointments,
                'approved_appointments': approved_appointments,
                'records_accessed': records_accessed,
                'patient_growth': growth_data
            }
        }), 200
    
    except Exception as e:
        print(f"Doctor overview error: {e}")
        return jsonify({'error': 'Failed to fetch analytics'}), 500

@bp.route('/admin/overview', methods=['GET'])
def admin_overview():
    """Get admin analytics overview"""
    user = get_user_from_token()
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        users_collection = get_users_collection()
        records_collection = get_records_collection()
        
        if users_collection is None or records_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Total users
        total_users = users_collection.count_documents({})
        total_patients = users_collection.count_documents({'role': 'patient'})
        total_doctors = users_collection.count_documents({'role': 'doctor'})
        verified_doctors = users_collection.count_documents({'role': 'doctor', 'is_verified': True})
        pending_doctors = users_collection.count_documents({'role': 'doctor', 'is_verified': False})
        
        # Records statistics
        total_records = records_collection.count_documents({'is_deleted': False})
        deleted_records = records_collection.count_documents({'is_deleted': True})
        
        # Recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_registrations = users_collection.count_documents({
            'created_at': {'$gte': seven_days_ago}
        })
        
        recent_uploads = records_collection.count_documents({
            'uploaded_at': {'$gte': seven_days_ago},
            'is_deleted': False
        })
        
        # Growth trends (last 12 months)
        growth_data = []
        for i in range(12):
            month_start = datetime.utcnow() - timedelta(days=30 * (11 - i))
            month_end = datetime.utcnow() - timedelta(days=30 * (10 - i))
            
            user_count = users_collection.count_documents({
                'created_at': {'$gte': month_start, '$lt': month_end}
            })
            
            record_count = records_collection.count_documents({
                'uploaded_at': {'$gte': month_start, '$lt': month_end},
                'is_deleted': False
            })
            
            growth_data.append({
                'month': month_start.strftime('%b %Y'),
                'users': user_count,
                'records': record_count
            })
        
        return jsonify({
            'success': True,
            'overview': {
                'total_users': total_users,
                'total_patients': total_patients,
                'total_doctors': total_doctors,
                'verified_doctors': verified_doctors,
                'pending_doctors': pending_doctors,
                'total_records': total_records,
                'deleted_records': deleted_records,
                'recent_registrations': recent_registrations,
                'recent_uploads': recent_uploads,
                'growth_trends': growth_data
            }
        }), 200
    
    except Exception as e:
        print(f"Admin overview error: {e}")
        return jsonify({'error': 'Failed to fetch analytics'}), 500
