"""
Data Preprocessing Module

This module handles data preprocessing for model inference.
Transforms raw patient data into features suitable for the trained model.

Processing steps:
    1. Convert dictionary to DataFrame
    2. Remove non-feature columns (patient_id)
    3. Encode categorical variables (gender)
    4. Convert to numeric types
"""

import pandas as pd


def preprocess_patient_data(data):
    """
    Preprocess raw patient data for model prediction.
    
    Transforms input dictionary into a feature vector matching the
    structure expected by the trained Random Forest model.
    
    Processing:
        1. Convert dict to DataFrame for consistent handling
        2. Drop patient_id (metadata, not a feature)
        3. Encode gender: Male=0, Female=1, Other=2
        4. Convert all columns to float for model compatibility
    
    Args:
        data (dict): Raw patient data
            Example: {
                "patient_id": "P001",
                "age": 45,
                "gender": "Male",
                "bmi": 28.5,
                ...
            }
    
    Returns:
        pd.DataFrame: Preprocessed feature vector (1 row)
        
    Raises:
        KeyError: If required fields are missing
        ValueError: If encoding fails
        
    Example:
        patient = {
            "patient_id": "P001",
            "age": 45,
            "gender": "Male",
            "bmi": 28.5,
            ...
        }
        X = preprocess_patient_data(patient)
        predictions = model.predict(X)
    
    Note:
        - In production, use pre-fitted encoders (joblib)
        - This simple implementation is for demonstration
        - For real systems, replicate training preprocessing exactly
    """
    # Step 1: Convert dictionary to DataFrame (single row)
    df = pd.DataFrame([data])
    
    # Step 2: Drop non-feature columns
    if 'patient_id' in df.columns:
        df = df.drop(columns=['patient_id'])
    
    # Step 3: Encode categorical variables
    # Gender encoding: Male=0, Female=1, Other=2
    if 'gender' in df.columns:
        gender_mapping = {'Male': 0, 'Female': 1, 'Other': 2}
        df['gender'] = df['gender'].map(gender_mapping)
    
    # Step 4: Ensure all columns are numeric (booleans -> int -> float)
    df = df.astype(float)
    
    return df
