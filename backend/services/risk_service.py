"""
Risk Prediction Service Module

This module contains business logic for risk prediction operations.
It orchestrates the full prediction workflow:
    1. Validate patient data
    2. Perform risk prediction using ML model
    3. Generate SHAP explanations
    4. Store results in MongoDB
"""

from risk_engine.predictor import predict_risk
from risk_engine.explain import get_explanation
from database.mongo import get_predictions_collection
from datetime import datetime


class RiskService:
    """
    Risk prediction service.
    
    Orchestrates the complete prediction workflow including
    model inference, explainability, and result storage.
    """
    
    @staticmethod
    def run_prediction(patient_data):
        """
        Execute complete risk prediction workflow.
        
        Process:
            1. Load trained Random Forest model
            2. Preprocess patient data
            3. Perform binary classification prediction
            4. Generate SHAP-based feature explanations
            5. Combine results with metadata
            6. Store prediction in MongoDB
            7. Return result to caller
        
        Args:
            patient_data (dict): Validated patient data
                Must contain all required fields:
                - patient_id, age, gender, bmi, blood_pressure,
                  cholesterol, glucose, smoker, history_of_heart_disease
        
        Returns:
            dict: Prediction result containing:
                - patient_id (str)
                - risk_score (float): Probability 0-1
                - risk_level (str): Low, Moderate, or High
                - confidence (float): Model confidence
                - explanation (dict): SHAP feature importances
                - timestamp (datetime): UTC prediction time
                
        Raises:
            FileNotFoundError: If model file not found
            ValueError: If data preprocessing fails
            Exception: Other unexpected errors
            
        Example:
            patient = {
                "patient_id": "P001",
                "age": 45,
                "gender": "Male",
                "bmi": 28.5,
                ...
            }
            result = RiskService.run_prediction(patient)
            print(f"Risk Level: {result['risk_level']}")
        """
        try:
            # Step 1: Perform risk prediction using trained model
            # Returns: {risk_score, risk_level, confidence}
            prediction_results = predict_risk(patient_data)
            
            # Step 2: Generate SHAP explanations
            # Shows feature contribution to prediction
            explanation = get_explanation(patient_data)
            
            # Step 3: Combine results
            result = {
                "patient_id": patient_data["patient_id"],
                **prediction_results,  # Unpack risk_score, risk_level, confidence
                "explanation": explanation,
                "timestamp": datetime.utcnow()
            }
            
            # Step 4: Store in MongoDB for audit trail
            predictions = get_predictions_collection()
            insert_result = predictions.insert_one(result.copy())
            
            # Step 5: Remove MongoDB _id before returning
            result.pop('_id', None)
            
            return result
            
        except Exception as e:
            # Log and re-raise for proper error handling in routes
            raise Exception(f"Prediction failed: {str(e)}")
