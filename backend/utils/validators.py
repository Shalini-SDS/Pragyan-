"""
Request Validation Module

This module provides decorators for request validation using Marshmallow schemas.
Validates incoming JSON request bodies against defined schemas.

Decorators:
    - validate_schema: Validates request body against a schema class
"""

from flask import request, jsonify
from functools import wraps
from marshmallow import ValidationError


def validate_schema(schema_class):
    """
    Decorator for validating request JSON against a Marshmallow schema.
    
    This decorator:
        1. Extracts JSON from request body
        2. Validates against provided schema
        3. Passes validated data to handler function
        4. Returns validation errors if data is invalid
    
    Args:
        schema_class: Marshmallow Schema class for validation
        
    Returns:
        function: Decorated function that validates before executing
        
    Raises:
        ValidationError: If request data doesn't match schema
        
    Example Usage:
        from models.patient_model import PatientSchema
        
        @app.route('/predict', methods=['POST'])
        @validate_schema(PatientSchema)
        def predict(data):
            # data is already validated
            return {"result": "success"}
    
    Validation Response (400):
        If validation fails, returns JSON with error details:
        {
            "errors": {
                "age": ["Missing data for required field."],
                "gender": ["Not a valid choice."]
            }
        }
    
    Notes:
        - Validates both presence and type of fields
        - Runs validators defined in schema
        - Converts data types as specified in schema
        - Empty/missing fields return helpful error messages
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if request has JSON
            if not request.is_json:
                return jsonify({
                    "errors": "Request must be JSON"
                }), 400
            
            # Create schema instance
            schema = schema_class()
            
            try:
                # Load and validate request JSON
                data = schema.load(request.json)
            except ValidationError as err:
                # Return validation errors with 400 status
                return jsonify({
                    "errors": err.messages
                }), 400
            
            # Call original function with validated data
            return f(data, *args, **kwargs)
        
        return decorated_function
    
    return decorator
