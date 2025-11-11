"""
Unique ID Generator for Users
Generates unique IDs for patients and doctors
"""

import random
import string
import secrets
from app.models.database import get_users_collection


def generate_unique_id(role):
    """
    Generate a unique random ID based on user role
    - Patients: PAT-XXXXXXXX (8 random alphanumeric characters)
    - Doctors: DOC-XXXXXXXX (8 random alphanumeric characters)
    
    Uses cryptographically secure random generation for unpredictability
    """
    users_collection = get_users_collection()
    
    if role == 'patient':
        prefix = 'PAT'
        field_name = 'patient_id'
    elif role == 'doctor':
        prefix = 'DOC'
        field_name = 'doctor_id'
    else:
        return None
    
    max_attempts = 20
    for _ in range(max_attempts):
        # Generate 8-character random alphanumeric string (uppercase letters and digits)
        # This gives us 36^8 = 2.8 trillion possible combinations
        characters = string.ascii_uppercase + string.digits
        random_part = ''.join(secrets.choice(characters) for _ in range(8))
        unique_id = f"{prefix}-{random_part}"
        
        # Check if ID already exists
        existing = users_collection.find_one({field_name: unique_id})
        if not existing:
            return unique_id
    
    # If we couldn't generate a unique ID after max_attempts, raise an error
    raise ValueError(f"Could not generate unique {role} ID after {max_attempts} attempts")


def get_next_sequential_id(role):
    """
    Alternative method: Generate sequential IDs
    - Patients: PAT-000001, PAT-000002, etc.
    - Doctors: DOC-000001, DOC-000002, etc.
    """
    users_collection = get_users_collection()
    
    if role == 'patient':
        prefix = 'PAT'
        field_name = 'patient_id'
    elif role == 'doctor':
        prefix = 'DOC'
        field_name = 'doctor_id'
    else:
        return None
    
    # Find the highest existing ID
    pipeline = [
        {'$match': {field_name: {'$regex': f'^{prefix}-'}}},
        {'$project': {
            'number': {
                '$toInt': {
                    '$substr': [f'${field_name}', len(prefix) + 1, -1]
                }
            }
        }},
        {'$sort': {'number': -1}},
        {'$limit': 1}
    ]
    
    result = list(users_collection.aggregate(pipeline))
    
    if result:
        next_number = result[0]['number'] + 1
    else:
        next_number = 1
    
    # Format with leading zeros (6 digits)
    unique_id = f"{prefix}-{next_number:06d}"
    return unique_id
