"""
User Model and Schema Module

This module defines the User schema for authentication and data validation.
Supports hospital staff (doctors, nurses, admins) with role-based access.
"""

from marshmallow import Schema, fields, validate, post_load, validates, ValidationError
from passlib.hash import pbkdf2_sha256
from datetime import datetime

class UserSchema(Schema):
    """
    User Schema for Registration and Login Validation
    Supports hospital staff with roles: doctor, nurse, admin
    """
    id = fields.Str(dump_only=True)
    hospital_id = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=50),
        error_messages={"required": "Hospital ID is required"}
    )
    email = fields.Email(
        required=False,
        allow_none=True,
        error_messages={"required": "Email is optional"}
    )
    staff_id = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=50),
        error_messages={"required": "Staff ID is required"}
    )
    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100),
        error_messages={"required": "Name is required"}
    )
    password = fields.Str(
        required=False,
        load_only=True,
        allow_none=True,
        validate=validate.Length(min=6),
    )
    role = fields.Str(
        required=True,
        dump_default="nurse",
        validate=validate.OneOf(["doctor", "nurse", "admin", "staff"]),
        error_messages={"required": "Role is required"}
    )
    specialization = fields.Str(
        allow_none=True,
        validate=validate.Length(max=100)
    )
    phone = fields.Str(
        allow_none=True,
        validate=validate.Length(max=20)
    )
    department = fields.Str(
        allow_none=True,
        validate=validate.Length(max=100)
    )
    is_password_reset = fields.Bool(dump_default=False)
    is_active = fields.Bool(dump_default=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    last_login = fields.DateTime(allow_none=True, dump_only=True)

    @staticmethod
    def hash_password(password):
        """Hash a password for storing."""
        if password:
            return pbkdf2_sha256.hash(password)
        return None

    @staticmethod
    def verify_password(password, hashed_password):
        """Verify a stored password against one provided by user."""
        if not hashed_password:
            return False
        return pbkdf2_sha256.verify(password, hashed_password)


class DoctorSchema(Schema):
    """Schema for Doctor entity"""
    id = fields.Str(dump_only=True)
    hospital_id = fields.Str(required=True)
    staff_id = fields.Str(required=True)
    name = fields.Str(required=True)
    email = fields.Email()
    phone = fields.Str()
    specialization = fields.Str(required=True)
    department = fields.Str(required=True)
    qualifications = fields.List(fields.Str(), allow_none=True)
    experience_years = fields.Int(allow_none=True)
    license_number = fields.Str(allow_none=True)
    availability = fields.Dict(allow_none=True)
    is_active = fields.Bool(dump_default=True)
    created_at = fields.DateTime(dump_only=True)


class NurseSchema(Schema):
    """Schema for Nurse entity"""
    id = fields.Str(dump_only=True)
    hospital_id = fields.Str(required=True)
    staff_id = fields.Str(required=True)
    name = fields.Str(required=True)
    email = fields.Email()
    phone = fields.Str()
    department = fields.Str(required=True)
    shift = fields.Str(validate=validate.OneOf(["morning", "afternoon", "night"]))
    license_number = fields.Str(allow_none=True)
    qualifications = fields.List(fields.Str(), allow_none=True)
    is_active = fields.Bool(dump_default=True)
    created_at = fields.DateTime(dump_only=True)


class PatientSchema(Schema):
    """Schema for Patient entity"""
    id = fields.Str(dump_only=True)
    hospital_id = fields.Str(required=True)
    patient_id = fields.Str(required=True)
    name = fields.Str(required=True)
    age = fields.Int(required=True, validate=validate.Range(min=0, max=150))
    gender = fields.Str(validate=validate.OneOf(["Male", "Female", "Other"]))
    blood_group = fields.Str(allow_none=True)
    contact_number = fields.Str(required=True)
    email = fields.Email(allow_none=True)
    address = fields.Str(allow_none=True)
    guardian_name = fields.Str(allow_none=True)
    guardian_contact = fields.Str(allow_none=True)
    medical_history = fields.List(fields.Str(), allow_none=True)
    current_medications = fields.List(fields.Str(), allow_none=True)
    allergies = fields.List(fields.Str(), allow_none=True)
    is_active = fields.Bool(dump_default=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class TriageSchema(Schema):
    """Schema for Triage/Patient Assessment"""
    id = fields.Str(dump_only=True)
    hospital_id = fields.Str(required=True)
    patient_id = fields.Str(required=False, allow_none=True)
    nurse_id = fields.Str(required=True)
    gender = fields.Str(validate=validate.OneOf(["Male", "Female", "Other"]), allow_none=True)
    name = fields.Str(allow_none=True)
    age = fields.Int(allow_none=True, validate=validate.Range(min=0, max=150))
    contact_number = fields.Str(allow_none=True)
    guardian_name = fields.Str(allow_none=True)
    guardian_contact = fields.Str(allow_none=True)
    
    # Vital Signs
    blood_pressure = fields.Str(required=True)  # "120/80"
    heart_rate = fields.Int(required=True)
    temperature = fields.Float(required=True)
    respiratory_rate = fields.Int(required=True)
    oxygen_saturation = fields.Int(required=True)
    
    # Symptoms
    symptoms = fields.List(fields.Str(), required=True)
    duration = fields.Str(allow_none=True)
    severity = fields.Int(validate=validate.Range(min=1, max=10))
    
    # Medical Info
    previous_conditions = fields.List(fields.Str(), allow_none=True)
    current_medications = fields.List(fields.Str(), allow_none=True)
    
    # Assessment Results (from ML)
    predicted_department = fields.Str(allow_none=True)
    priority_level = fields.Str(allow_none=True)  # Low, Medium, High, Critical
    risk_score = fields.Float(allow_none=True)
    risk_level = fields.Str(allow_none=True)
    priority_score = fields.Float(allow_none=True)
    recommended_department = fields.Str(allow_none=True)
    confidence = fields.Float(allow_none=True)
    recommended_tests = fields.List(fields.Str(), allow_none=True)
    explainability = fields.Dict(allow_none=True)
    model_probability_high_risk = fields.Float(allow_none=True)
    vital_abnormality_score = fields.Float(allow_none=True)
    critical_symptom_score = fields.Float(allow_none=True)
    
    # Meta
    assigned_doctor_id = fields.Str(allow_none=True)
    status = fields.Str(validate=validate.OneOf(["pending", "in_progress", "completed"]))
    notes = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class HospitalSchema(Schema):
    """Schema for Hospital entity"""
    id = fields.Str(dump_only=True)
    hospital_id = fields.Str(required=True, unique=True)
    name = fields.Str(required=True)
    address = fields.Str(required=True)
    phone = fields.Str(required=True)
    email = fields.Email()
    departments = fields.List(fields.Str())
    total_beds = fields.Int()
    available_beds = fields.Int()
    admin_name = fields.Str()
    admin_email = fields.Email()
    admin_phone = fields.Str()
    is_active = fields.Bool(dump_default=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
