"""
Patient Routes Module

This module defines API endpoints for patient data operations.

Endpoints:
    - GET /api/patient/<patient_id>: Retrieve patient information
"""

from flask import Blueprint, jsonify
from services.patient_service import PatientService

# Create Blueprint for patient routes
patient_bp = Blueprint('patient', __name__)


@patient_bp.route('/<string:patient_id>', methods=['GET'])
def get_patient(patient_id):
    """
    Get patient information by patient ID.
    
    Retrieves patient data from MongoDB database.
    
    Args:
        patient_id (str): Unique patient identifier
        
    Returns:
        JSON response with patient data and 200 status on success
        JSON response with error message and 404 status if not found
        
    Example:
        GET /api/patient/P001
        Response: {
            "patient_id": "P001",
            "age": 45,
            "gender": "Male",
            ...
        }
    """
    patient = PatientService.get_patient_by_id(patient_id)
    
    if not patient:
        return jsonify({
            "error": f"Patient with ID '{patient_id}' not found"
        }), 404
    
    return jsonify(patient), 200
