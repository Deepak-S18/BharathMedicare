#!/usr/bin/env python3
"""
Quick test script to verify MongoDB connection
"""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')

print("=" * 60)
print("MongoDB Connection Test")
print("=" * 60)
print(f"\nMongoDB URI: {MONGO_URI}")
print("\nAttempting to connect...")

try:
    # Create MongoDB client with timeout
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    
    # Test the connection
    client.admin.command('ping')
    
    print("✓ Successfully connected to MongoDB!")
    
    # Get database info
    db = client['bharathmedicare']
    collections = db.list_collection_names()
    
    print(f"\nDatabase: bharathmedicare")
    print(f"Collections found: {len(collections)}")
    
    if collections:
        print("\nExisting collections:")
        for col in collections:
            count = db[col].count_documents({})
            print(f"  - {col}: {count} documents")
    else:
        print("\nNo collections yet (database is empty)")
    
    # Check for users
    users_count = db.users.count_documents({})
    print(f"\nTotal users: {users_count}")
    
    if users_count > 0:
        # Show user roles
        patients = db.users.count_documents({'role': 'patient'})
        doctors = db.users.count_documents({'role': 'doctor'})
        admins = db.users.count_documents({'role': 'admin'})
        
        print(f"  - Patients: {patients}")
        print(f"  - Doctors: {doctors}")
        print(f"  - Admins: {admins}")
    
    print("\n" + "=" * 60)
    print("✓ MongoDB is ready to use!")
    print("=" * 60)
    
    client.close()
    
except ConnectionFailure as e:
    print(f"\n✗ Connection failed: {e}")
    print("\nPossible solutions:")
    print("1. Check if MongoDB service is running")
    print("2. Verify MONGO_URI in .env file")
    print("3. Check if port 27017 is accessible")
    
except ServerSelectionTimeoutError as e:
    print(f"\n✗ Server selection timeout: {e}")
    print("\nPossible solutions:")
    print("1. MongoDB service might not be running")
    print("2. Check if MongoDB is listening on localhost:27017")
    print("3. Try: net start MongoDB (as administrator)")
    
except Exception as e:
    print(f"\n✗ Unexpected error: {e}")
    print(f"Error type: {type(e).__name__}")

print()
