
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request
from database.mongo import get_users_collection

def role_required(required_role):
    """
    Decorator to restrict access to specific roles.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            email = claims.get("sub")
            
            users = get_users_collection()
            user = users.find_one({"email": email})
            
            if not user or user.get("role") != required_role:
                return jsonify({"error": "Unauthorized access. Required role: " + required_role}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def admin_required(f):
    return role_required("admin")(f)

def doctor_required(f):
    return role_required("doctor")(f)
