"""
MongoDB Database Operations Module

This module provides utility functions for accessing MongoDB collections.

Functions:
    - get_db(): Get the MongoDB database instance
    - get_patients_collection(): Get the patients collection
    - get_predictions_collection(): Get the predictions collection
    
Collections:
    - patients: Stores patient data
    - predictions: Stores prediction results with explanations
"""

from extensions import mongo


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


def get_patients_collection():
    """
    Get the patients collection from MongoDB.
    
    This collection stores patient demographic and health data.
    
    Schema:
        {
            "_id": ObjectId,
            "patient_id": str (unique),
            "age": int,
            "gender": str,
            "bmi": float,
            "blood_pressure": int,
            "cholesterol": int,
            "glucose": int,
            "smoker": bool,
            "history_of_heart_disease": bool
        }
    
    Returns:
        Collection: MongoDB patients collection
        
    Example:
        patients = get_patients_collection()
        patient = patients.find_one({"patient_id": "P001"})
    """
    return mongo.db.patients


def get_predictions_collection():
    """
    Get the predictions collection from MongoDB.
    
    This collection stores risk prediction results with SHAP explanations.
    
    Schema:
        {
            "_id": ObjectId,
            "patient_id": str,
            "risk_score": float (0-1),
            "risk_level": str (Low, Moderate, High),
            "confidence": float,
            "explanation": {feature: shap_value, ...},
            "timestamp": datetime
        }
    
    Returns:
        Collection: MongoDB predictions collection
        
    Example:
        predictions = get_predictions_collection()
        recent = predictions.find_one(sort=[("timestamp", -1)])
    """
    return mongo.db.predictions
