"""
MongoDB Database Operations Module

This module provides utility functions for accessing MongoDB collections
and initializing database indexes for the healthcare system.

Collections:
    - users: Hospital staff accounts (doctors, nurses, admins)
    - patients: Patient demographic and health data
    - doctors: Doctor profiles with specializations
    - nurses: Nurse profiles and assignments
    - triages: Patient triage assessments
    - predictions: Risk predictions with ML explanations
    - hospitals: Hospital information
    - bed_assignments: Hospital bed management
"""

from extensions import mongo
from datetime import datetime


def get_db():
    """
    Get the MongoDB database instance.
    
    Returns:
        Database: MongoDB database object for custom operations
        
    Example:
        db = get_db()
        collections = db.list_collection_names()
    """
    return mongo.db


def initialize_indexes():
    """Initialize MongoDB indexes for better query performance."""
    db = get_db()
    
    # Users collection
    db.users.create_index([("hospital_id", 1), ("staff_id", 1)], unique=True)
    db.users.create_index([("email", 1)], sparse=True)
    db.users.create_index([("role", 1)])
    
    # Patients collection
    db.patients.create_index([("hospital_id", 1), ("patient_id", 1)], unique=True)
    db.patients.create_index([("hospital_id", 1)])
    
    # Doctors collection
    db.doctors.create_index([("hospital_id", 1), ("staff_id", 1)], unique=True)
    db.doctors.create_index([("department", 1)])
    db.doctors.create_index([("specialization", 1)])
    
    # Nurses collection
    db.nurses.create_index([("hospital_id", 1), ("staff_id", 1)], unique=True)
    db.nurses.create_index([("department", 1)])
    db.nurses.create_index([("shift", 1)])
    
    # Triages collection
    db.triages.create_index([("hospital_id", 1), ("patient_id", 1)])
    db.triages.create_index([("nurse_id", 1)])
    db.triages.create_index([("created_at", -1)])
    
    # Predictions collection
    db.predictions.create_index([("hospital_id", 1), ("patient_id", 1)])
    db.predictions.create_index([("created_at", -1)])
    
    # Hospitals collection
    db.hospitals.create_index([("hospital_id", 1)], unique=True)
    
    # Bed assignments collection
    db.bed_assignments.create_index([("hospital_id", 1)])
    db.bed_assignments.create_index([("patient_id", 1)])


def get_users_collection():
    """
    Get the users collection from MongoDB.
    
    This collection stores user accounts for hospital staff.
    
    Returns:
        Collection: MongoDB users collection
    """
    return mongo.db.users


def get_patients_collection():
    """
    Get the patients collection from MongoDB.
    
    This collection stores patient demographic and health data.
    
    Returns:
        Collection: MongoDB patients collection
    """
    return mongo.db.patients


def get_doctors_collection():
    """
    Get the doctors collection from MongoDB.
    
    Returns:
        Collection: MongoDB doctors collection
    """
    return mongo.db.doctors


def get_nurses_collection():
    """
    Get the nurses collection from MongoDB.
    
    Returns:
        Collection: MongoDB nurses collection
    """
    return mongo.db.nurses


def get_triages_collection():
    """
    Get the triages collection from MongoDB.
    
    This collection stores patient triage assessments.
    
    Returns:
        Collection: MongoDB triages collection
    """
    return mongo.db.triages


def get_predictions_collection():
    """
    Get the predictions collection from MongoDB.
    
    This collection stores risk prediction results with ML explanations.
    
    Returns:
        Collection: MongoDB predictions collection
    """
    return mongo.db.predictions


def get_hospitals_collection():
    """
    Get the hospitals collection from MongoDB.
    
    Returns:
        Collection: MongoDB hospitals collection
    """
    return mongo.db.hospitals


def get_bed_assignments_collection():
    """
    Get the bed assignments collection from MongoDB.
    
    Returns:
        Collection: MongoDB bed assignments collection
    """
    return mongo.db.bed_assignments
