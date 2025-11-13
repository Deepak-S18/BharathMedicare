"""
Script to add sample testimonials to the database
Run this after you have some real users in your system
"""
from app.models.database import get_db
from datetime import datetime
from bson import ObjectId

def add_sample_testimonials():
    """Add sample testimonials from real users"""
    db = get_db()
    if db is None:
        print("❌ Database connection failed")
        return
    
    testimonials_collection = db['testimonials']
    users_collection = db['users']
    
    # Get some real users from the database
    patients = list(users_collection.find({'role': 'patient'}).limit(2))
    doctors = list(users_collection.find({'role': 'doctor', 'is_verified': True}).limit(1))
    
    if not patients and not doctors:
        print("❌ No users found in database. Please register some users first.")
        return
    
    # Sample testimonials (you can customize these)
    sample_testimonials = []
    
    if len(patients) > 0:
        sample_testimonials.append({
            'user_id': str(patients[0]['_id']),
            'message': 'Bharath Medicare has made managing my medical records so much easier. The security features give me complete peace of mind.',
            'rating': 5,
            'is_approved': True,
            'is_active': True,
            'created_at': datetime.utcnow()
        })
    
    if len(patients) > 1:
        sample_testimonials.append({
            'user_id': str(patients[1]['_id']),
            'message': 'The audit trail feature is amazing! I can see exactly who accessed my records and when. This transparency is exactly what healthcare needs.',
            'rating': 5,
            'is_approved': True,
            'is_active': True,
            'created_at': datetime.utcnow()
        })
    
    if len(doctors) > 0:
        sample_testimonials.append({
            'user_id': str(doctors[0]['_id']),
            'message': 'As a healthcare professional, having instant access to my patients\' medical history has significantly improved the quality of care I can provide.',
            'rating': 5,
            'is_approved': True,
            'is_active': True,
            'created_at': datetime.utcnow()
        })
    
    # Insert testimonials
    if sample_testimonials:
        result = testimonials_collection.insert_many(sample_testimonials)
        print(f"✓ Added {len(result.inserted_ids)} sample testimonials")
        print(f"✓ Testimonials are now visible on the landing page")
    else:
        print("❌ No testimonials to add")

if __name__ == '__main__':
    print("Adding sample testimonials...")
    add_sample_testimonials()
