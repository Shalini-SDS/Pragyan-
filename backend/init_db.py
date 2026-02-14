"""
Database Initialization Script

This script populates the MongoDB database with sample data for testing and development.

Usage:
    python init_db.py
"""

from app import create_app
from extensions import mongo
from database.mongo import initialize_indexes
from models.user_model import UserSchema
from datetime import datetime
import os

def init_database():
    """Initialize database with sample data."""
    
    app = create_app()
    
    with app.app_context():
        # Initialize indexes
        initialize_indexes()
        print("✓ Database indexes created")
        
        # Clear existing data (optional - uncomment for clean slate)
        # mongo.db.users.delete_many({})
        # mongo.db.hospitals.delete_many({})
        # print("✓ Cleared existing data")
        
        # Create sample hospitals
        hospitals_collection = mongo.db.hospitals
        
        sample_hospitals = [
            {
                "hospital_id": "HOSP001",
                "name": "City Medical Center",
                "address": "123 Main St, Healthcare City",
                "phone": "+1-555-0100",
                "email": "admin@cityhospital.com",
                "departments": ["Cardiology", "Neurology", "Orthopedics", "Emergency", "Pediatrics"],
                "total_beds": 500,
                "available_beds": 125,
                "admin_name": "Dr. Sarah Johnson",
                "admin_email": "sarah@cityhospital.com",
                "admin_phone": "+1-555-0101",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "hospital_id": "HOSP002",
                "name": "Riverside General Hospital",
                "address": "456 River Rd, Medical Town",
                "phone": "+1-555-0200",
                "email": "admin@riverside.com",
                "departments": ["Internal Medicine", "Gastroenterology", "Surgery", "Infectious Disease"],
                "total_beds": 300,
                "available_beds": 45,
                "admin_name": "Dr. Michael Chen",
                "admin_email": "michael@riverside.com",
                "admin_phone": "+1-555-0201",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        
        for hospital in sample_hospitals:
            if not hospitals_collection.find_one({"hospital_id": hospital["hospital_id"]}):
                hospitals_collection.insert_one(hospital)
                print(f"✓ Created hospital: {hospital['name']} ({hospital['hospital_id']})")
        
        # Create sample users (doctors, nurses, admins)
        users_collection = mongo.db.users
        
        sample_users = [
            {
                "hospital_id": "HOSP001",
                "staff_id": "DOC001",
                "name": "Dr. James Wilson",
                "email": "james.wilson@cityhospital.com",
                "role": "doctor",
                "specialization": "Cardiology",
                "department": "Cardiology",
                "phone": "+1-555-1001",
                "password": UserSchema.hash_password("password123"),
                "is_password_reset": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            },
            {
                "hospital_id": "HOSP001",
                "staff_id": "DOC002",
                "name": "Dr. Emily Brown",
                "email": "emily.brown@cityhospital.com",
                "role": "doctor",
                "specialization": "Neurology",
                "department": "Neurology",
                "phone": "+1-555-1002",
                "password": UserSchema.hash_password("password123"),
                "is_password_reset": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            },
            {
                "hospital_id": "HOSP001",
                "staff_id": "NURSE001",
                "name": "Maria Garcia",
                "email": "maria.garcia@cityhospital.com",
                "role": "nurse",
                "department": "Cardiology",
                "phone": "+1-555-1003",
                "password": UserSchema.hash_password("password123"),
                "is_password_reset": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            },
            {
                "hospital_id": "HOSP001",
                "staff_id": "NURSE002",
                "name": "Robert Lee",
                "email": "robert.lee@cityhospital.com",
                "role": "nurse",
                "department": "Emergency",
                "phone": "+1-555-1004",
                "password": UserSchema.hash_password("password123"),
                "is_password_reset": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            },
            {
                "hospital_id": "HOSP001",
                "staff_id": "ADMIN001",
                "name": "Admin User",
                "email": "admin@cityhospital.com",
                "role": "admin",
                "department": "Administration",
                "phone": "+1-555-1005",
                "password": UserSchema.hash_password("admin123"),
                "is_password_reset": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            },
            # Hospital 2 staff
            {
                "hospital_id": "HOSP002",
                "staff_id": "DOC001",
                "name": "Dr. Amanda Smith",
                "email": "amanda.smith@riverside.com",
                "role": "doctor",
                "specialization": "Internal Medicine",
                "department": "Internal Medicine",
                "phone": "+1-555-2001",
                "password": UserSchema.hash_password("password123"),
                "is_password_reset": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            },
            {
                "hospital_id": "HOSP002",
                "staff_id": "NURSE001",
                "name": "Jessica Martinez",
                "email": "jessica@riverside.com",
                "role": "nurse",
                "department": "Surgery",
                "phone": "+1-555-2003",
                "password": UserSchema.hash_password("password123"),
                "is_password_reset": False,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None
            }
        ]
        
        for user in sample_users:
            existing = users_collection.find_one({
                "hospital_id": user["hospital_id"],
                "staff_id": user["staff_id"]
            })
            if not existing:
                users_collection.insert_one(user)
                print(f"✓ Created user: {user['name']} ({user['staff_id']} @ {user['hospital_id']})")
        
        # Create sample doctors records
        doctors_collection = mongo.db.doctors
        
        sample_doctors = [
            {
                "hospital_id": "HOSP001",
                "staff_id": "DOC001",
                "name": "Dr. James Wilson",
                "email": "james.wilson@cityhospital.com",
                "phone": "+1-555-1001",
                "specialization": "Cardiology",
                "department": "Cardiology",
                "qualifications": ["MD", "Board Certified - Cardiology"],
                "experience_years": 15,
                "license_number": "MD-12345",
                "availability": {"monday": "09:00-17:00", "tuesday": "09:00-17:00"},
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "hospital_id": "HOSP001",
                "staff_id": "DOC002",
                "name": "Dr. Emily Brown",
                "email": "emily.brown@cityhospital.com",
                "phone": "+1-555-1002",
                "specialization": "Neurology",
                "department": "Neurology",
                "qualifications": ["MD", "Board Certified - Neurology"],
                "experience_years": 12,
                "license_number": "MD-12346",
                "is_active": True,
                "created_at": datetime.utcnow()
            }
        ]
        
        for doctor in sample_doctors:
            existing = doctors_collection.find_one({
                "hospital_id": doctor["hospital_id"],
                "staff_id": doctor["staff_id"]
            })
            if not existing:
                doctors_collection.insert_one(doctor)
                print(f"✓ Created doctor profile: {doctor['name']}")
        
        # Create sample nurses records
        nurses_collection = mongo.db.nurses
        
        sample_nurses = [
            {
                "hospital_id": "HOSP001",
                "staff_id": "NURSE001",
                "name": "Maria Garcia",
                "email": "maria.garcia@cityhospital.com",
                "phone": "+1-555-1003",
                "department": "Cardiology",
                "shift": "morning",
                "license_number": "RN-54321",
                "qualifications": ["RN", "BSN"],
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "hospital_id": "HOSP001",
                "staff_id": "NURSE002",
                "name": "Robert Lee",
                "email": "robert.lee@cityhospital.com",
                "phone": "+1-555-1004",
                "department": "Emergency",
                "shift": "night",
                "license_number": "RN-54322",
                "qualifications": ["RN", "BSN", "ACLS"],
                "is_active": True,
                "created_at": datetime.utcnow()
            }
        ]
        
        for nurse in sample_nurses:
            existing = nurses_collection.find_one({
                "hospital_id": nurse["hospital_id"],
                "staff_id": nurse["staff_id"]
            })
            if not existing:
                nurses_collection.insert_one(nurse)
                print(f"✓ Created nurse profile: {nurse['name']}")
        
        print("\n" + "="*50)
        print("✓ Database initialization complete!")
        print("="*50)
        print("\nTest Login Credentials:")
        print("-"*50)
        print("Hospital: City Medical Center (HOSP001)")
        print("Doctor Login:")
        print("  Staff ID: DOC001")
        print("  Password: password123")
        print("")
        print("Nurse Login:")
        print("  Staff ID: NURSE001")
        print("  Password: password123")
        print("")
        print("Hospital: Riverside General Hospital (HOSP002)")
        print("Doctor Login:")
        print("  Staff ID: DOC001")
        print("  Password: password123")
        print("-"*50)

if __name__ == '__main__':
    init_database()
