import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY', 'your-secret-key-here-change-in-production'))
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

def create_token(user_id, email, role):
    """Create JWT token"""
    try:
        payload = {
            'user_id': user_id,
            'email': email,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
        return token
    
    except Exception as e:
        print(f"Token creation error: {e}")
        return None

def decode_token(token):
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # DEBUG: Log all headers
        print(f"\n=== AUTH DEBUG for {request.path} ===")
        print(f"All headers: {dict(request.headers)}")
        
        auth_header = request.headers.get('Authorization')
        print(f"Authorization header: {auth_header}")
        
        if not auth_header:
            print("ERROR: No authorization header found")
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            token = auth_header.split(' ')[1]
            print(f"Extracted token (first 50 chars): {token[:50]}...")
        except IndexError:
            print("ERROR: Invalid authorization header format")
            return jsonify({'error': 'Invalid authorization header format'}), 401
        
        print(f"Using SECRET_KEY (first 20 chars): {SECRET_KEY[:20]}...")
        payload = decode_token(token)
        print(f"Decode result: {payload}")
        
        if 'error' in payload:
            print(f"ERROR: Token decode failed: {payload['error']}")
            return jsonify({'error': payload['error']}), 401
        
        # Attach user info to request
        request.user = payload
        print(f"SUCCESS: User authenticated: {payload.get('email')}")
        print("=== END AUTH DEBUG ===\n")
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(roles):
    """Decorator to require specific roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # First check if user is authenticated
            if not hasattr(request, 'user'):
                return jsonify({'error': 'Authentication required'}), 401
            
            user_role = request.user.get('role')
            
            if user_role not in roles:
                return jsonify({'error': f'Access denied. Required role: {", ".join(roles)}'}), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
