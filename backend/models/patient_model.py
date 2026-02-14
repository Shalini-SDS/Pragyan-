"""
Data Models and Validation Schemas

This module defines Marshmallow schemas for request/response validation.

Schemas:
    - PatientSchema: Validates patient data for risk prediction
    - RiskPredictionSchema: Validates risk prediction results
    
These schemas ensure data integrity and provide clear API contracts.
"""

from marshmallow import Schema, fields, validate


class PatientSchema(Schema):
    """
    Patient Data Schema for Request Validation
    
    Validates incoming patient data for risk prediction.
    All fields are required for accurate prediction.
    
    Fields:
        patient_id (str): Unique patient identifier
        age (int): Patient age in years (0-120)
        bmi (float): Body Mass Index
        blood_pressure (int): Systolic blood pressure
        cholesterol (int): Total cholesterol level
        glucose (int): Blood glucose level
        smoker (bool): Smoking status
        history_of_heart_disease (bool): Presence of heart disease history
        chest_pain (bool): Presence of chest pain
        shortness_of_breath (bool): Presence of shortness of breath
        dizziness (bool): Presence of dizziness
        fever (bool): Presence of fever
    """
    
    patient_id = fields.Str(
        required=True,
        error_messages={"required": "patient_id is required"}
    )
    
    age = fields.Int(
        required=True,
        validate=validate.Range(min=0, max=120),
        error_messages={
            "required": "age is required",
            "validator_failed": "age must be between 0 and 120"
        }
    )
    
    bmi = fields.Float(
        required=True,
        error_messages={"required": "bmi is required"}
    )
    
    blood_pressure = fields.Int(
        required=True,
        error_messages={"required": "blood_pressure is required"}
    )
    
    cholesterol = fields.Int(
        required=True,
        error_messages={"required": "cholesterol is required"}
    )
    
    glucose = fields.Int(
        required=True,
        error_messages={"required": "glucose is required"}
    )
    
    smoker = fields.Bool(
        required=True,
        error_messages={"required": "smoker is required"}
    )
    
    history_of_heart_disease = fields.Bool(
        required=True,
        error_messages={"required": "history_of_heart_disease is required"}
    )

    chest_pain = fields.Bool(
        required=True,
        error_messages={"required": "chest_pain is required"}
    )

    shortness_of_breath = fields.Bool(
        required=True,
        error_messages={"required": "shortness_of_breath is required"}
    )

    dizziness = fields.Bool(
        required=True,
        error_messages={"required": "dizziness is required"}
    )

    fever = fields.Bool(
        required=True,
        error_messages={"required": "fever is required"}
    )


class RiskPredictionSchema(Schema):
    """
    Risk Prediction Response Schema
    
    Validates the structure of risk prediction results
    stored in MongoDB.
    
    Fields:
        patient_id (str): Patient identifier
        risk_score (float): Probability score (0-1)
        risk_level (str): Categorical risk level
        confidence (float): Model confidence
        explanation (dict): SHAP feature importances
        timestamp (datetime): Prediction timestamp
    """
    
    patient_id = fields.Str(required=True)
    risk_score = fields.Float(required=True)
    risk_level = fields.Str(required=True)
    confidence = fields.Float(required=True)
    explanation = fields.Dict(required=True)
    timestamp = fields.DateTime(dump_only=True)
