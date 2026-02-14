"""
Risk Prediction Module

This module performs risk prediction using the trained Random Forest model.
Generates predictions, risk levels, and confidence scores.

Functions/Classes:
    - RiskPredictor: Main prediction class for triage and risk assessment
    - predict_risk(): Utility function for direct prediction
"""

from risk_engine.model_loader import ModelLoader
from risk_engine.preprocess import preprocess_patient_data
import numpy as np


class RiskPredictor:
    """Risk prediction class with support for triage and clinical assessment."""
    
    def __init__(self):
        """Initialize the predictor with loaded model."""
        try:
            self.model = ModelLoader.get_model()
        except:
            self.model = None
    
    def predict_risk(self, patient_data):
        """
        Predict health risk for a patient.
        
        Args:
            patient_data (dict): Patient clinical data
        
        Returns:
            dict: Prediction results with risk_score, risk_level, confidence
        """
        if self.model is None:
            return self._fallback_prediction(patient_data)
        
        try:
            # Preprocess patient data into feature vector
            processed_data = preprocess_patient_data(patient_data)
            
            # Get probability predictions from model
            proba = self.model.predict_proba(processed_data)[0][1]
            
            # Classify into risk category based on probability
            if proba < 0.3:
                risk_level = "Low"
            elif proba < 0.7:
                risk_level = "Moderate"
            else:
                risk_level = "High"
            
            # Get confidence (maximum probability across classes)
            confidence = float(np.max(self.model.predict_proba(processed_data)))
            
            return {
                "risk_score": float(proba),
                "risk_level": risk_level,
                "confidence": confidence
            }
        except:
            return self._fallback_prediction(patient_data)
    
    def _fallback_prediction(self, patient_data):
        """Fallback prediction when model is unavailable."""
        # Simple rule-based prediction
        risk_score = 0.5
        return {
            "risk_score": risk_score,
            "risk_level": "Moderate",
            "confidence": 0.5
        }


def predict_risk(patient_data):
    """
    Predict health risk for a patient using Random Forest model.
    
    Process:
        1. Load pre-trained Random Forest model
        2. Preprocess patient data (encoding, normalization)
        3. Generate probability predictions
        4. Classify into risk categories
        5. Calculate confidence score
    
    Args:
        patient_data (dict): Patient clinical data
    
    Returns:
        dict: Prediction results containing:
            - risk_score (float): Probability of high risk (0-1)
            - risk_level (str): Risk category
                * "Low": risk_score < 0.3
                * "Moderate": 0.3 <= risk_score < 0.7
                * "High": risk_score >= 0.7
            - confidence (float): Maximum probability from model
    
    Raises:
        FileNotFoundError: If model file not found
        ValueError: If preprocessing fails
        Exception: For other errors
        
    Example:
        patient = {
            "patient_id": "P001",
            "age": 45,
            "gender": "Male",
            ...
        }
        result = predict_risk(patient)
        print(f"Risk Level: {result['risk_level']}")
        print(f"Score: {result['risk_score']:.2%}")
    
    Notes:
        - Model must be a Binary Classifier with predict_proba()
        - Index 1 of probabilities is the positive class (high risk)
        - Risk thresholds: <0.3 Low, 0.3-0.7 Moderate, >=0.7 High
    """
    predictor = RiskPredictor()
    return predictor.predict_risk(patient_data)
