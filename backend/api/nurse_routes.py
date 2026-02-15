"""
Nurse Routes Module

This module defines API endpoints for nurse management.

Endpoints:
    - GET /api/nurse: List all nurses in hospital
    - POST /api/nurse: Create new nurse
    - GET /api/nurse/<staff_id>: Get nurse details
    - PUT /api/nurse/<staff_id>: Update nurse info
    - DELETE /api/nurse/<staff_id>: Delete nurse
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from database.mongo import get_nurses_collection, get_resource_status_collection, get_doctors_collection
from models.user_model import NurseSchema
from datetime import datetime

nurse_bp = Blueprint('nurse', __name__)


def get_hospital_from_jwt():
    """Extract hospital_id from JWT claims."""
    claims = get_jwt()
    return claims.get('hospital_id')


def get_role_from_jwt():
    claims = get_jwt()
    return claims.get('role')


@nurse_bp.route('', methods=['GET'])
@jwt_required()
def list_nurses():
    """
    Get list of all nurses in the hospital.
    
    Query Parameters:
        - page: int (default: 1)
        - limit: int (default: 10)
        - department: str (filter by department)
        - shift: str (filter by shift: morning/afternoon/night)
        - search: str (search by name)
    
    Returns:
        JSON: List of nurses with pagination info
    """
    try:
        hospital_id = get_hospital_from_jwt()
        nurses_collection = get_nurses_collection()
        
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        department = request.args.get('department')
        shift = request.args.get('shift')
        search = request.args.get('search', '')
        
        skip = (page - 1) * limit
        
        # Build query
        query = {"hospital_id": hospital_id, "is_active": True}
        
        if department:
            query["department"] = department
        if shift:
            query["shift"] = shift
        if search:
            query["name"] = {"$regex": search, "$options": "i"}
        
        # Get total count
        total = nurses_collection.count_documents(query)
        
        # Get paginated results
        nurses = list(nurses_collection.find(query).skip(skip).limit(limit))
        
        # Convert ObjectId to string
        for nurse in nurses:
            nurse['_id'] = str(nurse['_id'])
        
        return jsonify({
            "nurses": nurses,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nurse_bp.route('', methods=['POST'])
@jwt_required()
def create_nurse():
    """
    Create a new nurse record.
    
    Required JSON fields: (see NurseSchema)
    
    Returns:
        JSON: Created nurse data with 201 status
    """
    try:
        hospital_id = get_hospital_from_jwt()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        # Validate schema
        schema = NurseSchema()
        errors = schema.validate(data)
        if errors:
            return jsonify({"error": "Validation failed", "details": errors}), 400
        
        data['hospital_id'] = hospital_id
        data['created_at'] = datetime.utcnow()
        
        nurses_collection = get_nurses_collection()
        
        # Check duplicate staff_id
        if nurses_collection.find_one({
            "hospital_id": hospital_id,
            "staff_id": data['staff_id']
        }):
            return jsonify({"error": "Nurse with this staff ID already exists"}), 400
        
        result = nurses_collection.insert_one(data)
        data['_id'] = str(result.inserted_id)
        
        return jsonify(data), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nurse_bp.route('/<staff_id>', methods=['GET'])
@jwt_required()
def get_nurse(staff_id):
    """
    Get nurse information by staff ID.
    
    Args:
        staff_id (str): Nurse's staff identifier
        
    Returns:
        JSON: Nurse data
    """
    try:
        hospital_id = get_hospital_from_jwt()
        nurses_collection = get_nurses_collection()
        
        nurse = nurses_collection.find_one({
            "hospital_id": hospital_id,
            "staff_id": staff_id,
            "is_active": True
        })
        
        if not nurse:
            return jsonify({"error": "Nurse not found"}), 404
        
        nurse['_id'] = str(nurse['_id'])
        return jsonify(nurse), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nurse_bp.route('/<staff_id>', methods=['PUT'])
@jwt_required()
def update_nurse(staff_id):
    """
    Update nurse information.
    
    Args:
        staff_id (str): Nurse's staff identifier
        
    Returns:
        JSON: Updated nurse data
    """
    try:
        hospital_id = get_hospital_from_jwt()
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        nurses_collection = get_nurses_collection()
        
        # Remove fields that shouldn't be updated
        data.pop('hospital_id', None)
        data.pop('staff_id', None)
        data.pop('created_at', None)
        
        result = nurses_collection.update_one(
            {"hospital_id": hospital_id, "staff_id": staff_id},
            {"$set": data}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Nurse not found"}), 404
        
        nurse = nurses_collection.find_one({
            "hospital_id": hospital_id,
            "staff_id": staff_id
        })
        
        nurse['_id'] = str(nurse['_id'])
        return jsonify(nurse), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nurse_bp.route('/<staff_id>', methods=['DELETE'])
@jwt_required()
def delete_nurse(staff_id):
    """
    Soft delete nurse record.
    
    Args:
        staff_id (str): Nurse's staff identifier
        
    Returns:
        JSON: Deletion confirmation
    """
    try:
        hospital_id = get_hospital_from_jwt()
        nurses_collection = get_nurses_collection()
        
        result = nurses_collection.update_one(
            {"hospital_id": hospital_id, "staff_id": staff_id},
            {"$set": {"is_active": False}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Nurse not found"}), 404
        
        return jsonify({"message": "Nurse deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nurse_bp.route('/resources', methods=['GET'])
@jwt_required()
def get_resource_status():
    """
    Get hospital resource availability status.
    Accessible to authenticated staff (doctor/nurse/admin/staff).
    """
    try:
        role = get_role_from_jwt()
        if role not in {"doctor", "nurse", "admin", "staff"}:
            return jsonify({"error": "Unauthorized"}), 403

        hospital_id = get_hospital_from_jwt()
        collection = get_resource_status_collection()
        doctors_collection = get_doctors_collection()

        resource_doc = collection.find_one({"hospital_id": hospital_id})
        if not resource_doc:
            total_doctors = doctors_collection.count_documents({"hospital_id": hospital_id, "is_active": True})
            resource_doc = {
                "hospital_id": hospital_id,
                "resources": {
                    "doctors": {"available": total_doctors, "total": total_doctors},
                    "machines": {"available": 0, "total": 0},
                    "rooms": {"available": 0, "total": 0},
                },
                "updated_by": None,
                "updated_at": datetime.utcnow(),
                "notes": "",
            }
            collection.insert_one(resource_doc.copy())
            resource_doc = collection.find_one({"hospital_id": hospital_id})

        resource_doc["_id"] = str(resource_doc["_id"])
        return jsonify(resource_doc), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@nurse_bp.route('/resources', methods=['PUT'])
@jwt_required()
def upsert_resource_status():
    """
    Update hospital resource availability status.
    Only nurse/admin/staff can update values.
    """
    try:
        role = get_role_from_jwt()
        if role not in {"nurse", "admin", "staff"}:
            return jsonify({"error": "Only nurse/admin/staff can update resource status"}), 403

        data = request.get_json() or {}
        resources = data.get("resources") or {}
        if not isinstance(resources, dict):
            return jsonify({"error": "resources must be an object"}), 400

        def _sanitize(bucket):
            bucket = bucket or {}
            available = int(bucket.get("available", 0))
            total = int(bucket.get("total", 0))
            available = max(0, available)
            total = max(0, total)
            if available > total and total > 0:
                available = total
            return {"available": available, "total": total}

        payload_resources = {
            "doctors": _sanitize(resources.get("doctors")),
            "machines": _sanitize(resources.get("machines")),
            "rooms": _sanitize(resources.get("rooms")),
        }

        hospital_id = get_hospital_from_jwt()
        claims = get_jwt()
        updater = claims.get("staff_id") or claims.get("name")
        now = datetime.utcnow()

        collection = get_resource_status_collection()
        collection.update_one(
            {"hospital_id": hospital_id},
            {
                "$set": {
                    "resources": payload_resources,
                    "updated_by": updater,
                    "updated_at": now,
                    "notes": data.get("notes", ""),
                }
            },
            upsert=True
        )

        updated = collection.find_one({"hospital_id": hospital_id})
        updated["_id"] = str(updated["_id"])
        return jsonify(updated), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
