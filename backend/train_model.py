import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score

def train_random_forest(data_path, model_path, encoder_path):
    # Load dataset
    if not os.path.exists(data_path):
        print(f"Error: Data file not found at {data_path}")
        return

    df = pd.read_csv(data_path)

    # Separate features and targets
    # We will predict 'risk_level'
    # Features: age, bmi, blood_pressure, cholesterol, glucose, smoker, history_of_heart_disease, chest_pain, shortness_of_breath, dizziness, fever
    # Target: risk_level
    
    X = df.drop(['risk_level', 'department'], axis=1)
    y = df['risk_level']

    # Encode target
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)

    # Initialize and train Random Forest Classifier
    rf_clf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_clf.fit(X_train, y_train)

    # Predictions
    y_pred = rf_clf.predict(X_test)

    # Evaluation
    print("Model Training Complete.")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # Save model and encoder
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    joblib.dump(rf_clf, model_path)
    joblib.dump(le, encoder_path)
    print(f"Model saved to: {model_path}")
    print(f"Encoder saved to: {encoder_path}")

if __name__ == "__main__":
    DATA_PATH = "backend/data/synthetic_data.csv"
    MODEL_PATH = "backend/models/risk_model.joblib"
    ENCODER_PATH = "backend/models/risk_encoder.joblib"
    
    train_random_forest(DATA_PATH, MODEL_PATH, ENCODER_PATH)
