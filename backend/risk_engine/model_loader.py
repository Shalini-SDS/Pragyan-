"""
Model Loader Module

This module handles loading and caching the trained Random Forest model.
The model is loaded once and cached in memory for performance.

The model should be a scikit-learn Random Forest classifier trained on
healthcare data with features matching the PatientSchema.
"""

import joblib
import os
from flask import current_app


class ModelLoader:
    """
    Singleton model loader for the Random Forest classifier.
    
    Caches the model in memory after first load to avoid repeated
    disk I/O and model initialization overhead.
    """
    
    # Class variable to cache the loaded model
    _model = None
    
    @classmethod
    def get_model(cls):
        """
        Get the trained Random Forest model.
        
        Lazy-loads the model from disk on first call and caches it.
        Subsequent calls return the cached instance.
        
        Uses joblib for efficient serialization/deserialization of
        scikit-learn objects.
        
        Returns:
            RandomForestClassifier: Trained model instance
            
        Raises:
            FileNotFoundError: If model file not found at MODEL_PATH
            Exception: If model loading fails
            
        Example:
            model = ModelLoader.get_model()
            predictions = model.predict_proba(X_test)
        """
        if cls._model is None:
            # Get model path from Flask configuration
            model_path = current_app.config['MODEL_PATH']
            
            # Check if file exists
            if not os.path.exists(model_path):
                raise FileNotFoundError(
                    f"Model file not found at {model_path}\n"
                    f"Please ensure the trained model is saved at this location using:\n"
                    f"  joblib.dump(model, '{model_path}')"
                )
            
            try:
                # Load model from disk
                cls._model = joblib.load(model_path)
                print(f"Model loaded successfully from {model_path}")
            except Exception as e:
                raise Exception(
                    f"Failed to load model from {model_path}: {str(e)}"
                )
        
        return cls._model
    
    @classmethod
    def reset_model(cls):
        """
        Reset the cached model (useful for testing or model updates).
        
        Next call to get_model() will reload from disk.
        
        Example:
            ModelLoader.reset_model()  # Clear cache
            model = ModelLoader.get_model()  # Reload
        """
        cls._model = None
