"""
Risk Prediction Module

This module performs risk prediction using the trained Random Forest model.
Generates predictions, risk levels, and confidence scores.

Functions:
    - predict_risk(): Main prediction function
"""

from risk_engine.model_loader import ModelLoader
from risk_engine.preprocess import preprocess_patient_data
import numpy as np


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
    # Step 1: Load the trained model
    model = ModelLoader.get_model()
    
    # Step 2: Preprocess patient data into feature vector
    processed_data = preprocess_patient_data(patient_data)
    
    # Step 3: Get probability predictions from model
    # predict_proba returns [[prob_negative, prob_positive], ...]
    # We want probability of positive class (high risk)
    proba = model.predict_proba(processed_data)[0][1]
    
    # Step 4: Classify into risk category based on probability
    if proba < 0.3:
        risk_level = "Low"
    elif proba < 0.7:
        risk_level = "Moderate"
    else:
        risk_level = "High"
    
    # Step 5: Get confidence (maximum probability across classes)
    confidence = float(np.max(model.predict_proba(processed_data)))
    
    return {
        "risk_score": float(proba),
        "risk_level": risk_level,
        "confidence": confidence
    }
