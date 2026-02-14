"""
Asynchronous Risk Prediction Tasks

This module defines Celery tasks for background processing.
Uses the task queue for long-running operations that don't need
immediate response.

Tasks:
    - predict_risk_async: Asynchronous risk prediction
"""

from tasks.celery_app import celery
from services.risk_service import RiskService


@celery.task(name='tasks.risk_tasks.predict_risk_async')
def predict_risk_async(patient_data):
    """
    Asynchronous risk prediction task.
    
    This task runs in a Celery worker process and executes
    the complete risk prediction workflow asynchronously.
    
    Useful for:
        - Batch predictions
        - Long-running operations
        - Non-blocking API responses
        - High-volume requests
    
    Args:
        patient_data (dict): Patient clinical data
        
    Returns:
        dict: Prediction result (same as synchronous predict)
            - risk_score
            - risk_level
            - confidence
            - explanation (SHAP values)
            - timestamp
            
    Task Status:
        - PENDING: Task waiting to execute
        - STARTED: Task started execution
        - SUCCESS: Task completed successfully
        - FAILURE: Task failed with exception
        - RETRY: Task is being retried
        - REVOKED: Task was revoked/cancelled
    
    Example:
        # Submit task
        task = predict_risk_async.delay(patient_data)
        
        # Check status
        print(task.status)  # 'PENDING', 'SUCCESS', etc.
        
        # Get result when ready
        if task.ready():
            result = task.result
            
        # Check for exceptions
        if task.failed():
            print(task.info)  # Exception message
    
    Notes:
        - Celery worker must be running
        - Result stored in Redis backend (configurable)
        - Results expire after configured time (default: 1 hour)
        - Worker needs access to model file and MongoDB
    """
    try:
        # Create Flask app context if needed for database access
        # This is necessary because Celery tasks run in separate processes
        from app import create_app
        app = create_app()
        
        with app.app_context():
            # Execute the prediction using the service layer
            result = RiskService.run_prediction(patient_data)
            return result
    
    except Exception as e:
        # Log error and re-raise for Celery to handle
        print(f"Async prediction failed: {str(e)}")
        raise
