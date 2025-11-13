#!/usr/bin/env python3
"""
Create an admin user for BharathMedicare
"""
import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from app.utils.password import hash_password
from app.models.schemas import UserSchema
from datetime import datetime

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')

def create_admin_user():
    """Create an admin user"""
    print("=" * 60)
    print("Create Admin User for BharathMedicare")
    print("=" * 60)
    print()
    
    # Get admin details
    full_name = input("Enter admin full name: ").strip()
    if not full_name:
        print("Error: Full name is required")
        return
    
    email = input("Enter admin email: ").strip()
    if not email:
        print("Error: Email is required")
        return
    
    password = input("Enter admin password: ").strip()
    if not password:
        print("Error: Password is required")
        return
    
    confirm_password = input("Confirm password: ").strip()
    if password != confirm_password:
        print("Error: Passwords do not match")
        return
    
    phone = input("Enter admin phone (optional): ").strip() or None
    
    print()
    print("Creating admin user...")
    print(f"Name: {full_name}")
    print(f"Email: {email}")
    print(f"Phone: {phone or 'Not provided'}")
    print()
    
    confirm = input("Create this admin user? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Cancelled")
        return
    
    try:
        # Connect to MongoDB
        print("\nConnecting to MongoDB...")
        
        # Parse TLS setting from URI
        use_tls = 'tls=true' in MONGO_URI.lower() or 'ssl=true' in MONGO_URI.lower()
        
        connection_options = {
            'serverSelectionTimeoutMS': 10000,
            'connectTimeoutMS': 10000
        }
        
        if use_tls:
            connection_options['tls'] = True
            connection_options['tlsAllowInvalidCertificates'] = True
        
        client = MongoClient(MONGO_URI, **connection_options)
        client.admin.command('ping')
        print("✓ Connected to MongoDB")
        
        # Get database and collection
        db = client.bharathmedicare
        users_collection = db.users
        
        # Check if email already exists
        existing_user = users_collection.find_one({'email': email})
        if existing_user:
            print(f"\n✗ Error: User with email '{email}' already exists")
            print(f"   Role: {existing_user.get('role')}")
            print(f"   Name: {existing_user.get('full_name')}")
            
            # Ask if they want to update to admin
            if existing_user.get('role') != 'admin':
                update = input("\nUpdate this user to admin role? (yes/no): ").strip().lower()
                if update == 'yes':
                    users_collection.update_one(
                        {'email': email},
                        {'$set': {'role': 'admin', 'is_verified': True, 'is_active': True}}
                    )
                    print("✓ User updated to admin role")
                else:
                    print("Cancelled")
            return
        
        # Hash password
        password_hash = hash_password(password)
        
        # Create admin user document
        admin_user = {
            'email': email,
            'password_hash': password_hash,
            'role': 'admin',
            'full_name': full_name,
            'phone': phone,
            'nmc_uid': None,
            'rfid_id': None,
            'patient_id': None,
            'doctor_id': None,
            'profile_photo': None,
            'gender': None,
            'date_of_birth': None,
            'blood_group': None,
            'height': None,
            'weight': None,
            'address': None,
            'emergency_contact': None,
            'emergency_contact_name': None,
            'emergency_contact_relation': None,
            'allergies': [],
            'chronic_conditions': [],
            'current_medications': [],
            'specialization': None,
            'years_of_experience': None,
            'qualification': None,
            'hospital_affiliation': None,
            'consultation_fee': None,
            'languages_spoken': [],
            'bio': None,
            'is_verified': True,  # Admins are auto-verified
            'is_active': True,
            'is_profile_complete': True,  # Admins don't need profile completion
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert into database
        result = users_collection.insert_one(admin_user)
        
        print()
        print("=" * 60)
        print("✓ Admin user created successfully!")
        print("=" * 60)
        print(f"User ID: {result.inserted_id}")
        print(f"Email: {email}")
        print(f"Role: admin")
        print()
        print("You can now login with these credentials:")
        print(f"  Email: {email}")
        print(f"  Password: [the password you entered]")
        print()
        
        client.close()
        
    except Exception as e:
        print(f"\n✗ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    create_admin_user()
