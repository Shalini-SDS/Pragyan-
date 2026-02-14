"""
API Blueprint Module

This module organizes all API routes into Blueprints and registers them
with the Flask application. This provides clean modular separation of concerns.

Blueprints registered:
    - auth_bp: Authentication endpoints (/api/auth/)
    - patient_bp: Patient data endpoints (/api/patient/)
    - doctor_bp: Doctor data endpoints (/api/doctor/)
    - nurse_bp: Nurse data endpoints (/api/nurse/)
    - hospital_bp: Hospital info endpoints (/api/hospital/)
    - risk_bp: Risk prediction endpoints (/api/risk/)
    - triage_bp: Triage assessment endpoints (/api/triage/)
"""

from flask import Blueprint
from api.auth_routes import auth_bp
from api.patient_routes import patient_bp
from api.doctor_routes import doctor_bp
from api.nurse_routes import nurse_bp
from api.hospital_routes import hospital_bp
from api.risk_routes import risk_bp
from api.triage_routes import triage_bp

# Create the main API blueprint
api_bp = Blueprint('api', __name__)

# Register sub-blueprints with URL prefixes
api_bp.register_blueprint(auth_bp, url_prefix='/auth')
api_bp.register_blueprint(patient_bp, url_prefix='/patient')
api_bp.register_blueprint(doctor_bp, url_prefix='/doctor')
api_bp.register_blueprint(nurse_bp, url_prefix='/nurse')
api_bp.register_blueprint(hospital_bp, url_prefix='/hospital')
api_bp.register_blueprint(risk_bp, url_prefix='/risk')
api_bp.register_blueprint(triage_bp, url_prefix='/triage')
