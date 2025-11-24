from flask import Blueprint, request, jsonify
from app.models.database import get_users_collection
from app.models.schemas import UserSchema
from app.utils.auth import create_token
from app.utils.password import hash_password, verify_password, is_strong_password
from app.utils.audit import log_action
from twilio.rest import Client
import os

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Initialize Twilio client
twilio_client = Client(
    os.getenv('TWILIO_ACCOUNT_SID'),
    os.getenv('TWILIO_AUTH_TOKEN')
)
TWILIO_VERIFY_SERVICE_SID = os.getenv('TWILIO_VERIFY_SERVICE_SID')

def check_profile_completion(user):
    """Check if user profile is complete"""
    role = user.get('role')
    
    if role == 'patient':
        required_fields = [
            'full_name',
            'phone',
            'gender',
            'date_of_birth',
            'address',
            'blood_group',
            'emergency_contact_name',
            'emergency_contact',
            'emergency_contact_relation',
            'allergies',
            'chronic_conditions'
        ]
        
        # Check if all required fields are filled and not empty
        for field in required_fields:
            value = user.get(field)
            # For lists, check if they exist (even if empty, that's valid)
            # For other fields, check if they're not None or empty string
            if field in ['allergies', 'chronic_conditions']:
                if value is None:
                    return False
            else:
                if value is None or value == '':
                    return False
        
        return True
    
    elif role == 'doctor':
        required_fields = [
            'full_name',
            'phone',
            'gender',
            'date_of_birth',
            'blood_group',
            'specialization',
            'years_of_experience',
            'qualification',
            'languages_spoken'
        ]
        
        # Check if all required fields are filled and not empty
        for field in required_fields:
            value = user.get(field)
            # For lists, check if they exist (even if empty, that's valid)
            if field == 'languages_spoken':
                if value is None or (isinstance(value, list) and len(value) == 0):
                    return False
            else:
                if value is None or value == '':
                    return False
        
        return True
    
    else:
        return True  # Admin doesn't need profile completion

@bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        # Get users collection
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error. Please try again later.'}), 503
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'full_name', 'role']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate role
        if not UserSchema.validate_role(data['role']):
            return jsonify({'error': 'Invalid role. Must be patient, doctor, or admin'}), 400
        
        # Validate NMC UID for doctors
        if data['role'] == 'doctor':
            if 'nmc_uid' not in data or not data['nmc_uid']:
                return jsonify({'error': 'NMC UID is required for doctor registration'}), 400
            
            if not UserSchema.validate_nmc_uid(data['nmc_uid']):
                return jsonify({'error': 'Invalid NMC UID format. Must be 7 digits'}), 400
            
            # Check if NMC UID already registered
            existing_nmc = users_collection.find_one({'nmc_uid': data['nmc_uid']})
            if existing_nmc:
                return jsonify({'error': 'This NMC UID is already registered'}), 409
        
        # Check password strength
        is_strong, message = is_strong_password(data['password'])
        if not is_strong:
            return jsonify({'error': message}), 400
        
        # Check if user already exists
        existing_user = users_collection.find_one({'email': data['email']})
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 409
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        # Determine diabetic status
        is_diabetic_flag = data.get('is_diabetic', False)
        
        # Get optional RFID ID
        rfid_id = data.get('rfid_id')
        
        # If RFID provided, check if it's already registered
        if rfid_id:
            existing_rfid = users_collection.find_one({'rfid_id': rfid_id})
            if existing_rfid:
                return jsonify({'error': 'This RFID card is already registered'}), 409
        
        # Generate unique random ID for patient or doctor
        from app.utils.id_generator import generate_unique_id
        
        unique_id = None
        if data['role'] in ['patient', 'doctor']:
            try:
                unique_id = generate_unique_id(data['role'])
            except Exception as e:
                print(f"Error generating unique ID: {e}")
                return jsonify({'error': 'Failed to generate unique ID'}), 500
        
        # Create user document
        user_doc = UserSchema.create(
            email=data['email'],
            password_hash=password_hash,
            role=data['role'],
            full_name=data['full_name'],
            phone=data.get('phone'),
            nmc_uid=data.get('nmc_uid') if data['role'] == 'doctor' else None,
            is_diabetic=is_diabetic_flag,
            rfid_id=rfid_id
        )
        
        # Add unique ID to user document
        if data['role'] == 'patient':
            user_doc['patient_id'] = unique_id
            user_doc['is_profile_complete'] = False
        elif data['role'] == 'doctor':
            user_doc['doctor_id'] = unique_id
        
        # Insert into database
        result = users_collection.insert_one(user_doc)
        
        # Log the action
        log_action(str(result.inserted_id), 'register', 'user', str(result.inserted_id))
        
        # Different message for doctor vs patient
        if data['role'] == 'doctor':
            message = 'Registration successful! Your account is pending admin approval. You will be notified once verified.'
        else:
            message = 'User registered successfully'
        
        return jsonify({
            'message': message,
            'user_id': str(result.inserted_id),
            'requires_approval': data['role'] == 'doctor'
        }), 201
    
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed. Please try again.'}), 500

@bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT token"""
    try:
        # Get users collection
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error. Please try again later.'}), 503
        
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        # Find user
        user = users_collection.find_one({'email': data['email']})
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Verify password
        if not verify_password(data['password'], user['password_hash']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated. Please contact administrator.'}), 403
        
        # Check if doctor is verified
        if user['role'] == 'doctor' and not user.get('is_verified', False):
            return jsonify({'error': 'Your account is pending admin approval. Please wait for verification.'}), 403
        
        # Create JWT token immediately (don't wait for profile check)
        token = create_token(
            user_id=str(user['_id']),
            email=user['email'],
            role=user['role']
        )
        
        if not token:
            return jsonify({'error': 'Failed to create authentication token'}), 500
        
        # Check profile completion status (use cached value if available)
        is_complete = user.get('is_profile_complete', False)
        
        # Async operations (don't block response)
        # These will happen in background after response is sent
        try:
            # Only update profile completion if it's been more than 1 hour since last check
            from datetime import datetime, timedelta
            last_check = user.get('profile_last_checked')
            should_check = True
            
            if last_check:
                if isinstance(last_check, str):
                    last_check = datetime.fromisoformat(last_check)
                if datetime.utcnow() - last_check < timedelta(hours=1):
                    should_check = False
            
            if should_check:
                is_complete_new = check_profile_completion(user)
                if user.get('is_profile_complete') != is_complete_new:
                    users_collection.update_one(
                        {'_id': user['_id']},
                        {'$set': {
                            'is_profile_complete': is_complete_new,
                            'profile_last_checked': datetime.utcnow()
                        }}
                    )
                    is_complete = is_complete_new
            
            # Log the action (non-blocking)
            log_action(str(user['_id']), 'login', 'user', str(user['_id']))
        except Exception as e:
            # Don't fail login if background tasks fail
            print(f"Background task error: {e}")
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'role': user['role'],
                'full_name': user['full_name'],
                'is_profile_complete': is_complete  # Use calculated value
            }
        }), 200
    
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed. Please try again.'}), 500

@bp.route('/verify', methods=['GET'])
def verify_token():
    """Verify if token is valid"""
    try:
        from app.utils.auth import decode_token
        
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({'error': 'Invalid token format'}), 401
        
        # Decode token
        payload = decode_token(token)
        
        if 'error' in payload:
            return jsonify({'error': payload['error']}), 401
        
        return jsonify({
            'valid': True,
            'user': payload
        }), 200
    
    except Exception as e:
        print(f"Token verification error: {e}")
        return jsonify({'error': 'Token verification failed'}), 500

@bp.route('/send-otp', methods=['POST'])
def send_otp():
    """Send OTP to phone number via Twilio"""
    try:
        data = request.get_json()
        phone = data.get('phone')
        
        if not phone:
            return jsonify({'error': 'Phone number is required'}), 400
        
        # Ensure phone number has country code
        if not phone.startswith('+'):
            phone = '+91' + phone  # Default to India
        
        # Send OTP via Twilio Verify
        verification = twilio_client.verify.v2.services(
            TWILIO_VERIFY_SERVICE_SID
        ).verifications.create(to=phone, channel='sms')
        
        return jsonify({
            'message': 'OTP sent successfully',
            'status': verification.status
        }), 200
    
    except Exception as e:
        print(f"Send OTP error: {e}")
        return jsonify({'error': f'Failed to send OTP: {str(e)}'}), 500

@bp.route('/verify-otp-registration', methods=['POST'])
def verify_otp_registration():
    """Verify OTP for registration (no account check)"""
    try:
        data = request.get_json()
        phone = data.get('phone')
        otp = data.get('otp')
        
        if not phone or not otp:
            return jsonify({'error': 'Phone number and OTP are required'}), 400
        
        # Ensure phone number has country code
        if not phone.startswith('+'):
            phone = '+91' + phone
        
        # Verify OTP via Twilio
        verification_check = twilio_client.verify.v2.services(
            TWILIO_VERIFY_SERVICE_SID
        ).verification_checks.create(to=phone, code=otp)
        
        if verification_check.status != 'approved':
            return jsonify({'error': 'Invalid OTP', 'valid': False}), 401
        
        return jsonify({
            'message': 'OTP verified successfully',
            'valid': True
        }), 200
    
    except Exception as e:
        print(f"Verify OTP registration error: {e}")
        return jsonify({'error': f'OTP verification failed: {str(e)}'}), 500


@bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """Verify OTP and login user"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        phone = data.get('phone')
        otp = data.get('otp')
        
        if not phone or not otp:
            return jsonify({'error': 'Phone number and OTP are required'}), 400
        
        # Ensure phone number has country code
        if not phone.startswith('+'):
            phone = '+91' + phone
        
        # Verify OTP via Twilio
        verification_check = twilio_client.verify.v2.services(
            TWILIO_VERIFY_SERVICE_SID
        ).verification_checks.create(to=phone, code=otp)
        
        if verification_check.status != 'approved':
            return jsonify({'error': 'Invalid OTP'}), 401
        
        # Find user by phone number
        user = users_collection.find_one({'phone': phone})
        
        if not user:
            return jsonify({'error': 'No account found with this phone number'}), 404
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Check if doctor is verified
        if user['role'] == 'doctor' and not user.get('is_verified', False):
            return jsonify({'error': 'Your account is pending admin approval'}), 403
        
        # Check profile completion
        is_complete = check_profile_completion(user)
        
        # Create JWT token
        token = create_token(
            user_id=str(user['_id']),
            email=user['email'],
            role=user['role']
        )
        
        if not token:
            return jsonify({'error': 'Failed to create authentication token'}), 500
        
        # Log the action
        log_action(str(user['_id']), 'sms_login', 'user', str(user['_id']))
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'role': user['role'],
                'full_name': user['full_name'],
                'is_profile_complete': is_complete
            }
        }), 200
    
    except Exception as e:
        print(f"Verify OTP error: {e}")
        return jsonify({'error': f'OTP verification failed: {str(e)}'}), 500

@bp.route('/hospital-login', methods=['POST'])
def hospital_login():
    """Hospital portal QR-based login for patients"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        patient_id = data.get('patient_id')
        email = data.get('email')
        
        if not patient_id:
            return jsonify({'error': 'Patient ID is required'}), 400
        
        # Find patient by ID or email
        from bson import ObjectId
        query = {}
        
        # Check if it's a formatted patient ID (PAT-XXXXXX)
        if patient_id.startswith('PAT-'):
            query['patient_id'] = patient_id
        # Check if it's a MongoDB ObjectId
        elif ObjectId.is_valid(patient_id):
            query['_id'] = ObjectId(patient_id)
        # Otherwise treat as patient_id field
        else:
            query['patient_id'] = patient_id
        
        # Add email to query if provided
        if email:
            query['email'] = email
        
        if not query:
            return jsonify({'error': 'Invalid patient identifier'}), 400
        
        user = users_collection.find_one(query)
        
        if not user:
            return jsonify({'error': 'Patient not found'}), 404
        
        # Verify it's a patient account
        if user.get('role') != 'patient':
            return jsonify({'error': 'Only patient accounts can use hospital portal'}), 403
        
        # Check if account is active
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Check profile completion
        is_complete = check_profile_completion(user)
        
        # Create JWT token
        token = create_token(
            user_id=str(user['_id']),
            email=user['email'],
            role=user['role']
        )
        
        if not token:
            return jsonify({'error': 'Failed to create authentication token'}), 500
        
        # Log the action
        log_action(str(user['_id']), 'hospital_login', 'user', str(user['_id']))
        
        return jsonify({
            'message': 'Hospital login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'role': user['role'],
                'full_name': user['full_name'],
                'is_profile_complete': is_complete
            }
        }), 200
    
    except Exception as e:
        print(f"Hospital login error: {e}")
        return jsonify({'error': 'Hospital login failed'}), 500

@bp.route('/check-rfid', methods=['POST'])
def check_rfid():
    """Check if RFID card is already registered"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        rfid_id = data.get('rfid_id')
        
        if not rfid_id:
            return jsonify({'error': 'RFID ID is required'}), 400
        
        # Check if RFID exists
        existing_user = users_collection.find_one({'rfid_id': rfid_id})
        
        return jsonify({
            'exists': existing_user is not None,
            'message': 'RFID card already registered' if existing_user else 'RFID card available'
        }), 200
    
    except Exception as e:
        print(f"Check RFID error: {e}")
        return jsonify({'error': 'Failed to check RFID'}), 500

@bp.route('/rfid-login', methods=['POST'])
def rfid_login():
    """Login using RFID card"""
    try:
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        data = request.get_json()
        rfid_id = data.get('rfid_id')
        
        if not rfid_id:
            return jsonify({'error': 'RFID ID is required'}), 400
        
        # Find user by RFID
        user = users_collection.find_one({'rfid_id': rfid_id})
        
        if not user:
            return jsonify({'error': 'RFID card not registered'}), 404
        
        # Check if user is active
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Check if doctor is verified
        if user['role'] == 'doctor' and not user.get('is_verified', False):
            return jsonify({'error': 'Your account is pending admin approval'}), 403
        
        # Check profile completion
        is_complete = check_profile_completion(user)
        
        # Create JWT token
        token = create_token(
            user_id=str(user['_id']),
            email=user['email'],
            role=user['role']
        )
        
        if not token:
            return jsonify({'error': 'Failed to create authentication token'}), 500
        
        # Log the action
        log_action(str(user['_id']), 'rfid_login', 'user', str(user['_id']))
        
        return jsonify({
            'message': 'RFID login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'email': user['email'],
                'role': user['role'],
                'full_name': user['full_name'],
                'patient_id': user.get('patient_id'),
                'doctor_id': user.get('doctor_id'),
                'is_profile_complete': is_complete
            }
        }), 200
    
    except Exception as e:
        print(f"RFID login error: {e}")
        return jsonify({'error': 'RFID login failed'}), 500

@bp.route('/change-password', methods=['POST'])
def change_password():
    """Change user password"""
    try:
        from app.utils.auth import decode_token
        
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            token = auth_header.split(" ")[1]
        except IndexError:
            return jsonify({'error': 'Invalid token format'}), 401
        
        # Decode token
        payload = decode_token(token)
        if 'error' in payload:
            return jsonify({'error': payload['error']}), 401
        
        user_id = payload.get('user_id')
        
        # Get users collection
        users_collection = get_users_collection()
        if users_collection is None:
            return jsonify({'error': 'Database connection error'}), 503
        
        # Get request data
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Find user
        from bson import ObjectId
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        if not verify_password(current_password, user['password_hash']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Check new password strength
        is_strong, message = is_strong_password(new_password)
        if not is_strong:
            return jsonify({'error': message}), 400
        
        # Hash new password
        new_password_hash = hash_password(new_password)
        
        # Update password
        users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'password_hash': new_password_hash}}
        )
        
        # Log the action
        log_action(user_id, 'change_password', 'user', user_id)
        
        return jsonify({
            'message': 'Password changed successfully'
        }), 200
    
    except Exception as e:
        print(f"Change password error: {e}")
        return jsonify({'error': 'Failed to change password'}), 500