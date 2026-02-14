"""
Patient Routes Module

This module defines API endpoints for patient data operations.
Supports CRUD operations for patients in a hospital.

Endpoints:
    - GET /api/patient: List all patients in hospital
    - POST /api/patient: Create new patient record
    - GET /api/patient/<patient_id>: Retrieve patient information
    - PUT /api/patient/<patient_id>: Update patient information
    - DELETE /api/patient/<patient_id>: Delete patient record
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from database.mongo import get_patients_collection, get_triages_collection
from models.user_model import PatientSchema
from datetime import datetime
from bson.objectid import ObjectId
import uuid

patient_bp = Blueprint('patient', __name__)


def get_hospital_from_jwt():
    """Extract hospital_id from JWT claims."""
    claims = get_jwt()
    return claims.get('hospital_id')


@patient_bp.route('', methods=['GET'])
@jwt_required()
def list_patients():
    """
    Get list of all patients in the hospital.
    
    Query Parameters:
        - page: int (default: 1)
        - limit: int (default: 10)
        - search: str (search by name or patient_id)
    
    Returns:
        JSON: List of patients with pagination info
    """
    try:
        hospital_id = get_hospital_from_jwt()
        patients_collection = get_patients_collection()
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        search = request.args.get('search', '')
        
        skip = (page - 1) * limit
        
        # Build query
        query = {"hospital_id": hospital_id, "is_active": True}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"patient_id": {"$regex": search, "$options": "i"}}
            ]
        
        # Get total count
        total = patients_collection.count_documents(query)
        
        # Get paginated results
        patients = list(patients_collection.find(query).skip(skip).limit(limit))
        
        # Convert ObjectId to string
        for patient in patients:
            patient['_id'] = str(patient['_id'])
        
        return jsonify({
            "patients": patients,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@patient_bp.route('', methods=['POST'])
@jwt_required()
def create_patient():
    """
    Create a new patient record.
    
    Required JSON fields: (see PatientSchema)
    
    Returns:
        JSON: Created patient data with 201 status
    """
    try:
        hospital_id = get_hospital_from_jwt()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        data['hospital_id'] = hospital_id
        if not data.get('patient_id'):
            data['patient_id'] = f"PAT-{uuid.uuid4().hex[:8].upper()}"

        # Validate schema after server-populated fields are present
        schema = PatientSchema()
        errors = schema.validate(data)
        if errors:
            return jsonify({"error": "Validation failed", "details": errors}), 400

        data['created_at'] = datetime.utcnow()
        data['updated_at'] = datetime.utcnow()
        
        patients_collection = get_patients_collection()
        
        # Check duplicate patient_id
        if patients_collection.find_one({
            "hospital_id": hospital_id,
            "patient_id": data['patient_id']
        }):
            return jsonify({"error": "Patient with this ID already exists"}), 400
        
        result = patients_collection.insert_one(data)
        data['_id'] = str(result.inserted_id)
        
        return jsonify(data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@patient_bp.route('/<patient_id>', methods=['GET'])
@jwt_required()
def get_patient(patient_id):
    """
    Get patient information by patient ID.
    
    Args:
        patient_id (str): Unique patient identifier
        
    Returns:
        JSON response with patient data and 200 status on success
        JSON response with error message and 404 status if not found
    """
    try:
        hospital_id = get_hospital_from_jwt()
        patients_collection = get_patients_collection()
        
        patient = patients_collection.find_one({
            "hospital_id": hospital_id,
            "patient_id": patient_id,
            "is_active": True
        })
        
        if not patient:
            return jsonify({"error": f"Patient with ID '{patient_id}' not found"}), 404
        
        patient['_id'] = str(patient['_id'])
        
        # Get recent triages
        triages_collection = get_triages_collection()
        triages = list(triages_collection.find({
            "hospital_id": hospital_id,
            "patient_id": patient_id
        }).sort("created_at", -1).limit(5))
        
        for triage in triages:
            triage['_id'] = str(triage['_id'])
        
        return jsonify({
            "patient": patient,
            "recent_triages": triages
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@patient_bp.route('/<patient_id>', methods=['PUT'])
@jwt_required()
def update_patient(patient_id):
    """
    Update patient information.
    
    Args:
        patient_id (str): Unique patient identifier
        
    Returns:
        JSON: Updated patient data
    """
    try:
        hospital_id = get_hospital_from_jwt()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        patients_collection = get_patients_collection()
        
        # Remove fields that shouldn't be updated
        data.pop('hospital_id', None)
        data.pop('patient_id', None)
        data.pop('created_at', None)
        data['updated_at'] = datetime.utcnow()
        
        result = patients_collection.update_one(
            {"hospital_id": hospital_id, "patient_id": patient_id},
            {"$set": data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Patient not found"}), 404
        
        patient = patients_collection.find_one({
            "hospital_id": hospital_id,
            "patient_id": patient_id
        })
        
        patient['_id'] = str(patient['_id'])
        return jsonify(patient), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@patient_bp.route('/<patient_id>', methods=['DELETE'])
@jwt_required()
def delete_patient(patient_id):
    """
    Soft delete patient record.
    
    Args:
        patient_id (str): Unique patient identifier
        
    Returns:
        JSON: Deletion confirmation
    """
    try:
        hospital_id = get_hospital_from_jwt()
        patients_collection = get_patients_collection()
        
        result = patients_collection.update_one(
            {"hospital_id": hospital_id, "patient_id": patient_id},
            {
                "$set": {
                    "is_active": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Patient not found"}), 404
        
        return jsonify({"message": "Patient deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
