"""
API Blueprint Module

This module organizes all API routes into Blueprints and registers them
with the Flask application. This provides clean modular separation of concerns.

Blueprints registered:
    - patient_bp: Patient data endpoints
    - risk_bp: Risk prediction endpoints
    
URL Prefixes:
    - /api/patient/
    - /api/risk/
"""

from flask import Blueprint
from api.patient_routes import patient_bp
from api.risk_routes import risk_bp

# Create the main API blueprint
api_bp = Blueprint('api', __name__)

# Register sub-blueprints with URL prefixes
api_bp.register_blueprint(patient_bp, url_prefix='/patient')
api_bp.register_blueprint(risk_bp, url_prefix='/risk')
