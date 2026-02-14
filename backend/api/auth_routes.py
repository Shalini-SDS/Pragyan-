"""
Authentication Routes Module

This module defines API endpoints for hospital staff authentication.
Supports login with hospital_id + staff_id, password reset on first login.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user_model import UserSchema
from database.mongo import (
    get_users_collection,
    get_hospitals_collection,
    get_doctors_collection,
    get_nurses_collection,
)
from utils.validators import validate_schema
from datetime import datetime
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__)


def _serialize_user(user):
    """Convert DB user document into frontend-safe payload."""
    return {
        "id": str(user['_id']),
        "name": user.get('name'),
        "email": user.get('email'),
        "role": user.get('role'),
        "staff_id": user.get('staff_id'),
        "hospital_id": user.get('hospital_id'),
        "department": user.get('department'),
        "specialization": user.get('specialization'),
        "phone": user.get('phone'),
    }


@auth_bp.route('/hospitals', methods=['GET'])
def get_hospitals():
    """
    Get list of all hospitals for login selection.
    
    Returns:
        JSON: List of hospitals with their IDs and names
    """
    try:
        hospitals_collection = get_hospitals_collection()
        hospitals = list(hospitals_collection.find(
            {"is_active": True},
            {"_id": 0, "hospital_id": 1, "name": 1, "address": 1}
        ))
        return jsonify({"hospitals": hospitals}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate hospital staff with hospital_id and staff_id, then password.
    
    Required JSON fields:
        - hospital_id: str
        - staff_id: str
        - password: str
    
    Returns:
        - If password not set: {"access_token": token, "needs_password_reset": true, "user": {...}}
        - If password set: {"access_token": token, "user": {...}, "role": "doctor/nurse/admin"}
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Missing request body"}), 400
    
    hospital_id = data.get('hospital_id')
    staff_id = data.get('staff_id')
    password = data.get('password')
    
    if not hospital_id or not staff_id:
        return jsonify({"error": "Missing hospital_id or staff_id"}), 400
    
    users_collection = get_users_collection()
    
    try:
        # Find user by hospital_id and staff_id
        user = users_collection.find_one({
            "hospital_id": hospital_id,
            "staff_id": staff_id,
            "is_active": True
        })
        
        if not user:
            return jsonify({"error": "Invalid hospital_id or staff_id"}), 401
        
        # Check if password is not set (first login)
        if not user.get('password'):
            if not password or len(password) < 6:
                return jsonify({
                    "error": "Password reset required",
                    "needs_password_reset": True,
                    "access_token": create_access_token(identity=str(user['_id'])),
                    "user": {
                        "id": str(user['_id']),
                        "name": user.get('name'),
                        "role": user.get('role'),
                        "staff_id": user.get('staff_id'),
                        "hospital_id": user.get('hospital_id')
                    }
                }), 200
            else:
                # Set password on first login
                hashed_password = UserSchema.hash_password(password)
                users_collection.update_one(
                    {"_id": user['_id']},
                    {
                        "$set": {
                            "password": hashed_password,
                            "is_password_reset": True,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                user['password'] = hashed_password
        
        # Verify password
        if not UserSchema.verify_password(password, user.get('password', '')):
            return jsonify({"error": "Invalid password"}), 401
        
        # Update last login
        users_collection.update_one(
            {"_id": user['_id']},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create JWT token
        access_token = create_access_token(
            identity=str(user['_id']),
            additional_claims={"role": user.get('role'), "hospital_id": hospital_id}
        )
        
        return jsonify({
            "access_token": access_token,
            "user": _serialize_user(user),
            "needs_password_reset": False
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Register a new hospital staff account and return authenticated session.

    Required fields:
        - hospital_id
        - staff_id
        - name
        - role (doctor|nurse|admin|staff)
        - password (min 6 chars)
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "Missing request body"}), 400

    hospital_id = data.get('hospital_id')
    staff_id = data.get('staff_id')
    name = data.get('name')
    role = data.get('role', 'staff')
    password = data.get('password')

    if not hospital_id or not staff_id or not name or not password:
        return jsonify({"error": "hospital_id, staff_id, name, and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if role not in ['doctor', 'nurse', 'admin', 'staff']:
        return jsonify({"error": "Invalid role"}), 400

    users_collection = get_users_collection()
    hospitals_collection = get_hospitals_collection()

    try:
        hospital = hospitals_collection.find_one({"hospital_id": hospital_id, "is_active": True})
        if not hospital:
            return jsonify({"error": "Invalid hospital_id"}), 400

        existing_user = users_collection.find_one({
            "hospital_id": hospital_id,
            "staff_id": staff_id
        })
        if existing_user:
            return jsonify({"error": "Staff ID already exists for this hospital"}), 409

        now = datetime.utcnow()
        new_user = {
            "hospital_id": hospital_id,
            "staff_id": staff_id,
            "name": name,
            "email": data.get('email'),
            "role": role,
            "department": data.get('department'),
            "specialization": data.get('specialization'),
            "phone": data.get('phone'),
            "password": UserSchema.hash_password(password),
            "is_password_reset": True,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
            "last_login": now
        }

        result = users_collection.insert_one(new_user)
        new_user['_id'] = result.inserted_id

        # Keep role-specific directory collections in sync.
        if role == 'doctor':
            get_doctors_collection().insert_one({
                "hospital_id": hospital_id,
                "staff_id": staff_id,
                "name": name,
                "email": data.get('email'),
                "phone": data.get('phone'),
                "specialization": data.get('specialization'),
                "department": data.get('department'),
                "qualifications": data.get('qualifications') or [],
                "experience_years": data.get('experience_years'),
                "license_number": data.get('license_number'),
                "is_active": True,
                "created_at": now,
            })
        elif role == 'nurse':
            get_nurses_collection().insert_one({
                "hospital_id": hospital_id,
                "staff_id": staff_id,
                "name": name,
                "email": data.get('email'),
                "phone": data.get('phone'),
                "department": data.get('department'),
                "shift": data.get('shift', 'morning'),
                "license_number": data.get('license_number'),
                "qualifications": data.get('qualifications') or [],
                "is_active": True,
                "created_at": now,
            })

        access_token = create_access_token(
            identity=str(new_user['_id']),
            additional_claims={"role": role, "hospital_id": hospital_id}
        )

        return jsonify({
            "access_token": access_token,
            "user": _serialize_user(new_user),
            "needs_password_reset": False
        }), 201
    except Exception as e:
        return jsonify({"error": f"Signup failed: {str(e)}"}), 500


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change user password (after first login).
    
    Required JWT token in header.
    Required JSON fields:
        - old_password: str
        - new_password: str
    
    Returns:
        JSON: Success message
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('old_password') or not data.get('new_password'):
        return jsonify({"error": "Missing old_password or new_password"}), 400
    
    if len(data.get('new_password', '')) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400
    
    users_collection = get_users_collection()
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Verify old password
        if not UserSchema.verify_password(data['old_password'], user.get('password', '')):
            return jsonify({"error": "Invalid old password"}), 401
        
        # Update with new password
        hashed_password = UserSchema.hash_password(data['new_password'])
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return jsonify({"message": "Password changed successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Password change failed: {str(e)}"}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    Logout user. (Simple implementation - JWT is stateless)
    Frontend should remove token from localStorage.
    
    Returns:
        JSON: Logout confirmation
    """
    return jsonify({"message": "Logged out successfully"}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current authenticated user information.
    
    Returns:
        JSON: User details
    """
    user_id = get_jwt_identity()
    users_collection = get_users_collection()
    
    try:
        user = users_collection.find_one(
            {"_id": ObjectId(user_id)},
            {"password": 0}  # Exclude password
        )
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "id": str(user['_id']),
            "name": user.get('name'),
            "email": user.get('email'),
            "role": user.get('role'),
            "staff_id": user.get('staff_id'),
            "hospital_id": user.get('hospital_id'),
            "department": user.get('department'),
            "specialization": user.get('specialization'),
            "phone": user.get('phone'),
            "is_active": user.get('is_active')
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
