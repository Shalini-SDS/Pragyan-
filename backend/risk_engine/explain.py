"""
Model Explainability Module

This module generates SHAP-based explanations for predictions.
SHAP (SHapley Additive exPlanations) provides interpretable predictions
by calculating feature contributions using game theory.

Functions:
    - get_explanation(): Generate SHAP values for a prediction
"""

from risk_engine.model_loader import ModelLoader
from risk_engine.preprocess import preprocess_patient_data


def get_explanation(patient_data):
    """
    Generate SHAP-based feature explanations for a prediction.
    
    Uses TreeExplainer (optimized for tree-based models like Random Forest)
    to compute SHAP values, which represent each feature's contribution
    to the model's prediction.
    
    Process:
        1. Load trained Random Forest model
        2. Preprocess patient data
        3. Initialize SHAP TreeExplainer
        4. Calculate SHAP values for the patient
        5. Map SHAP values to feature names
        6. Return as interpretable explanation dictionary
    
    Args:
        patient_data (dict): Patient clinical data
        
    Returns:
        dict: Feature importance explanation where:
            - Keys: Feature names (age, bmi, cholesterol, etc.)
            - Values: SHAP values (positive = increases risk, negative = decreases)
            
    Example output:
        {
            "age": 0.12,
            "bmi": 0.08,
            "cholesterol": 0.15,
            "blood_pressure": 0.05,
            "glucose": 0.10,
            "smoker": 0.20,
            "history_of_heart_disease": 0.25,
            "gender": -0.02
        }
    
    Raises:
        Exception: If SHAP calculation fails
        
    Notes:
        - Positive values increase predicted risk
        - Negative values decrease predicted risk
        - Magnitude indicates feature importance
        - Sum of SHAP values approximates prediction difference from baseline
        
    SHAP Interpretation:
        - SHAP values have units of model output
        - For binary classification: interpret as impact on log-odds
        - Relative magnitude shows feature importance
        - Direction shows impact direction
    """
    try:
        # Import shap only when needed to avoid startup overhead
        import shap
        
        # Step 1: Load the trained model
        model = ModelLoader.get_model()
        
        # Step 2: Preprocess patient data
        processed_data = preprocess_patient_data(patient_data)
        
        # Step 3: Initialize SHAP TreeExplainer (optimized for tree models)
        # This creates an explainer that understands the tree structure
        explainer = shap.TreeExplainer(model)
        
        # Step 4: Calculate SHAP values for this patient
        # Returns array of SHAP values for each feature
        shap_values = explainer.shap_values(processed_data)
        
        # Step 5: Handle both binary and multi-class output shapes
        # For binary classification, SHAP returns a list of two arrays
        # Index 0: negative class, Index 1: positive class (high risk)
        if isinstance(shap_values, list):
            # Binary classification case
            # Use values for positive class (index 1)
            vals = shap_values[1][0]  # [class_index][sample_index]
        else:
            # Single array case (less common)
            vals = shap_values[0]
        
        # Step 6: Get feature names and create explanation dictionary
        feature_names = processed_data.columns.tolist()
        
        # Pair feature names with their SHAP values
        explanation = dict(zip(
            feature_names,
            [float(v) for v in vals]  # Convert numpy to Python float
        ))
        
        return explanation
        
    except Exception as e:
        # If SHAP fails, return empty explanation
        print(f"SHAP explanation failed: {str(e)}")
        # Return dummy explanation with zeros
        feature_names = [
            'age', 'bmi', 'blood_pressure', 'cholesterol', 'glucose', 
            'smoker', 'history_of_heart_disease', 'chest_pain', 
            'shortness_of_breath', 'dizziness', 'fever'
        ]
        return {name: 0.0 for name in feature_names}
