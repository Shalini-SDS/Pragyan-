"""
Patient Service Module

This module contains business logic for patient data operations.
Services coordinate between API routes and database layer.

Methods:
    - get_patient_by_id(): Retrieve patient by ID
    - save_patient(): Save or update patient data
"""

from database.mongo import get_patients_collection
from bson import ObjectId


class PatientService:
    """
    Patient data management service.
    
    Handles patient data operations including retrieval and persistence.
    """
    
    @staticmethod
    def get_patient_by_id(patient_id):
        """
        Retrieve a patient's information by patient ID.
        
        Searches the patients collection by the patient_id string field,
        not the MongoDB _id field.
        
        Args:
            patient_id (str): Unique patient identifier
            
        Returns:
            dict: Patient data without MongoDB _id, or None if not found
            
        Example:
            patient = PatientService.get_patient_by_id("P001")
            if patient:
                print(f"Age: {patient['age']}")
        """
        patients = get_patients_collection()
        # Search by patient_id string field, not MongoDB _id
        patient = patients.find_one(
            {"patient_id": patient_id},
            {"_id": 0}  # Exclude MongoDB _id from response
        )
        return patient
    
    @staticmethod
    def save_patient(patient_data):
        """
        Save or update patient data in MongoDB.
        
        Uses upsert operation: if patient exists, updates data;
        if not, creates new document.
        
        Args:
            patient_data (dict): Patient data to save
                Must include "patient_id" field
                
        Example:
            patient_data = {
                "patient_id": "P001",
                "age": 45,
                "gender": "Male",
                ...
            }
            PatientService.save_patient(patient_data)
        """
        patients = get_patients_collection()
        patients.update_one(
            {"patient_id": patient_data["patient_id"]},
            {"$set": patient_data},
            upsert=True  # Create if doesn't exist
        )
