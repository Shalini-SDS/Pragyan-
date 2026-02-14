"""
Risk Prediction Routes Module

This module defines API endpoints for risk prediction operations.

Endpoints:
    - POST /api/risk/predict: Synchronous risk prediction
    - POST /api/risk/predict-async: Asynchronous risk prediction via Celery
    
Features:
    - Request validation using Marshmallow schemas
    - Risk prediction using trained Random Forest model
    - SHAP-based model explainability
    - MongoDB result storage
    - Async task support with Celery
"""

from flask import Blueprint, jsonify
from services.risk_service import RiskService
from utils.validators import validate_schema
from models.patient_model import PatientSchema
from tasks.risk_tasks import predict_risk_async

# Create Blueprint for risk routes
risk_bp = Blueprint('risk', __name__)


@risk_bp.route('/predict', methods=['POST'])
@validate_schema(PatientSchema)
def predict(data):
    """
    Synchronous risk prediction endpoint.
    
    Accepts patient data, validates it, performs risk prediction,
    and returns the result with SHAP explanations.
    
    Args:
        data (dict): Validated patient data from request JSON
        
    Returns:
        JSON response with prediction results:
            - risk_score: Probability score (0-1)
            - risk_level: Categorical risk level (Low, Moderate, High)
            - confidence: Model confidence in the prediction
            - explanation: SHAP feature importance values
            - timestamp: UTC timestamp of prediction
            
    Status Codes:
        200: Successful prediction
        400: Invalid request data
        500: Server error during prediction
        
    Example:
        POST /api/risk/predict
        {
            "patient_id": "P001",
            "age": 45,
            "gender": "Male",
            "bmi": 28.5,
            ...
        }
        
        Response (200):
        {
            "patient_id": "P001",
            "risk_score": 0.65,
            "risk_level": "Moderate",
            "confidence": 0.85,
            "explanation": {...},
            "timestamp": "2024-01-15T10:30:00.000Z"
        }
    """
    try:
        result = RiskService.run_prediction(data)
        return jsonify(result), 200
    
    except FileNotFoundError as e:
        return jsonify({
            "error": f"Model file not found: {str(e)}",
            "status_code": 500
        }), 500
    
    except Exception as e:
        return jsonify({
            "error": f"Prediction error: {str(e)}",
            "status_code": 500
        }), 500


@risk_bp.route('/predict-async', methods=['POST'])
@validate_schema(PatientSchema)
def predict_async(data):
    """
    Asynchronous risk prediction endpoint.
    
    Submits a risk prediction task to Celery message queue.
    Client receives a task ID and can poll for results later.
    
    This is useful for long-running predictions or batch processing.
    
    Args:
        data (dict): Validated patient data from request JSON
        
    Returns:
        JSON response with task information:
            - task_id: Unique identifier for the submitted task
            - status: Task status message
            
    Status Codes:
        202: Task accepted (Accepted)
        400: Invalid request data
        500: Server error
        
    Example:
        POST /api/risk/predict-async
        {
            "patient_id": "P001",
            ...
        }
        
        Response (202):
        {
            "task_id": "abc123def456xyz789",
            "status": "Task submitted"
        }
        
        # Later, check status using Flower UI or Celery API
        # GET /api/task-status/<task_id>
    """
    try:
        task = predict_risk_async.delay(data)
        return jsonify({
            "task_id": task.id,
            "status": "Task submitted",
            "message": "Prediction is being processed asynchronously"
        }), 202
    
    except Exception as e:
        return jsonify({
            "error": f"Failed to submit task: {str(e)}",
            "status_code": 500
        }), 500
