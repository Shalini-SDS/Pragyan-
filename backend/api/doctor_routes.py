"""
Doctor Routes Module

This module defines API endpoints for doctor management.

Endpoints:
    - GET /api/doctor: List all doctors in hospital
    - POST /api/doctor: Create new doctor
    - GET /api/doctor/<staff_id>: Get doctor details
    - PUT /api/doctor/<staff_id>: Update doctor info
    - DELETE /api/doctor/<staff_id>: Delete doctor
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from database.mongo import get_doctors_collection, get_users_collection
from models.user_model import DoctorSchema, UserSchema
from datetime import datetime
from bson.objectid import ObjectId

doctor_bp = Blueprint('doctor', __name__)


def get_hospital_from_jwt():
    """Extract hospital_id from JWT claims."""
    claims = get_jwt()
    return claims.get('hospital_id')


@doctor_bp.route('', methods=['GET'])
@jwt_required()
def list_doctors():
    """
    Get list of all doctors in the hospital.
    
    Query Parameters:
        - page: int (default: 1)
        - limit: int (default: 10)
        - department: str (filter by department)
        - specialization: str (filter by specialization)
        - search: str (search by name)
    
    Returns:
        JSON: List of doctors with pagination info
    """
    try:
        hospital_id = get_hospital_from_jwt()
        doctors_collection = get_doctors_collection()
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        department = request.args.get('department')
        specialization = request.args.get('specialization')
        search = request.args.get('search', '')
        
        skip = (page - 1) * limit
        
        # Build query
        query = {"hospital_id": hospital_id, "is_active": True}
        
        if department:
            query["department"] = department
        if specialization:
            query["specialization"] = specialization
        if search:
            query["name"] = {"$regex": search, "$options": "i"}
        
        # Get total count
        total = doctors_collection.count_documents(query)
        
        # Get paginated results
        doctors = list(doctors_collection.find(query).skip(skip).limit(limit))
        
        # Convert ObjectId to string
        for doctor in doctors:
            doctor['_id'] = str(doctor['_id'])
        
        return jsonify({
            "doctors": doctors,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@doctor_bp.route('', methods=['POST'])
@jwt_required()
def create_doctor():
    """
    Create a new doctor record.
    
    Required JSON fields: (see DoctorSchema)
    
    Returns:
        JSON: Created doctor data with 201 status
    """
    try:
        hospital_id = get_hospital_from_jwt()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        # Validate schema
        schema = DoctorSchema()
        errors = schema.validate(data)
        if errors:
            return jsonify({"error": "Validation failed", "details": errors}), 400
        
        data['hospital_id'] = hospital_id
        data['created_at'] = datetime.utcnow()
        
        doctors_collection = get_doctors_collection()
        
        # Check duplicate staff_id
        if doctors_collection.find_one({
            "hospital_id": hospital_id,
            "staff_id": data['staff_id']
        }):
            return jsonify({"error": "Doctor with this staff ID already exists"}), 400
        
        result = doctors_collection.insert_one(data)
        data['_id'] = str(result.inserted_id)
        
        return jsonify(data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@doctor_bp.route('/<staff_id>', methods=['GET'])
@jwt_required()
def get_doctor(staff_id):
    """
    Get doctor information by staff ID.
    
    Args:
        staff_id (str): Doctor's staff identifier
        
    Returns:
        JSON: Doctor data
    """
    try:
        hospital_id = get_hospital_from_jwt()
        doctors_collection = get_doctors_collection()
        
        doctor = doctors_collection.find_one({
            "hospital_id": hospital_id,
            "staff_id": staff_id,
            "is_active": True
        })
        
        if not doctor:
            return jsonify({"error": "Doctor not found"}), 404
        
        doctor['_id'] = str(doctor['_id'])
        return jsonify(doctor), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@doctor_bp.route('/<staff_id>', methods=['PUT'])
@jwt_required()
def update_doctor(staff_id):
    """
    Update doctor information.
    
    Args:
        staff_id (str): Doctor's staff identifier
        
    Returns:
        JSON: Updated doctor data
    """
    try:
        hospital_id = get_hospital_from_jwt()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        doctors_collection = get_doctors_collection()
        
        # Remove fields that shouldn't be updated
        data.pop('hospital_id', None)
        data.pop('staff_id', None)
        data.pop('created_at', None)
        
        result = doctors_collection.update_one(
            {"hospital_id": hospital_id, "staff_id": staff_id},
            {"$set": data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Doctor not found"}), 404
        
        doctor = doctors_collection.find_one({
            "hospital_id": hospital_id,
            "staff_id": staff_id
        })
        
        doctor['_id'] = str(doctor['_id'])
        return jsonify(doctor), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@doctor_bp.route('/<staff_id>', methods=['DELETE'])
@jwt_required()
def delete_doctor(staff_id):
    """
    Soft delete doctor record.
    
    Args:
        staff_id (str): Doctor's staff identifier
        
    Returns:
        JSON: Deletion confirmation
    """
    try:
        hospital_id = get_hospital_from_jwt()
        doctors_collection = get_doctors_collection()
        
        result = doctors_collection.update_one(
            {"hospital_id": hospital_id, "staff_id": staff_id},
            {"$set": {"is_active": False}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Doctor not found"}), 404
        
        return jsonify({"message": "Doctor deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
