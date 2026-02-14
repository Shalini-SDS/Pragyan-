"""
Example test cases for Healthcare Risk Prediction API

This file contains example requests and responses for testing the API.
"""

# ============================================================================
# TEST CASE 1: Health Check
# ============================================================================
# Description: Verify the API is running and healthy
# Expected: 200 OK with healthy status

# Request:
GET /health

# Response (200):
{
    "status": "healthy",
    "service": "Healthcare Risk Prediction API"
}


# ============================================================================
# TEST CASE 2: Get Patient (Not Found)
# ============================================================================
# Description: Try to retrieve a patient that doesn't exist
# Expected: 404 Not Found

# Request:
GET /api/patient/NONEXISTENT

# Response (404):
{
    "error": "Patient with ID 'NONEXISTENT' not found"
}


# ============================================================================
# TEST CASE 3: Predict Risk - Valid Request
# ============================================================================
# Description: Valid risk prediction request with all required fields
# Expected: 200 OK with prediction results

# Request:
POST /api/risk/predict
Content-Type: application/json

{
    "patient_id": "P001",
    "age": 45,
    "gender": "Male",
    "bmi": 28.5,
    "blood_pressure": 130,
    "cholesterol": 200,
    "glucose": 105,
    "smoker": false,
    "history_of_heart_disease": false
}

# Response (200):
{
    "patient_id": "P001",
    "risk_score": 0.65,
    "risk_level": "Moderate",
    "confidence": 0.85,
    "explanation": {
        "age": 0.12,
        "gender": -0.02,
        "bmi": 0.08,
        "blood_pressure": 0.05,
        "cholesterol": 0.15,
        "glucose": 0.10,
        "smoker": 0.20,
        "history_of_heart_disease": 0.25
    },
    "timestamp": "2024-01-15T10:30:45.123456"
}


# ============================================================================
# TEST CASE 4: Predict Risk - Missing Required Field
# ============================================================================
# Description: Request missing required field (age)
# Expected: 400 Bad Request with validation error

# Request:
POST /api/risk/predict
Content-Type: application/json

{
    "patient_id": "P001",
    "gender": "Male",
    "bmi": 28.5,
    "blood_pressure": 130,
    "cholesterol": 200,
    "glucose": 105,
    "smoker": false,
    "history_of_heart_disease": false
}

# Response (400):
{
    "errors": {
        "age": ["Missing data for required field."]
    }
}


# ============================================================================
# TEST CASE 5: Predict Risk - Invalid Age
# ============================================================================
# Description: Age out of valid range (0-120)
# Expected: 400 Bad Request with validation error

# Request:
POST /api/risk/predict
Content-Type: application/json

{
    "patient_id": "P001",
    "age": 150,
    "gender": "Male",
    "bmi": 28.5,
    "blood_pressure": 130,
    "cholesterol": 200,
    "glucose": 105,
    "smoker": false,
    "history_of_heart_disease": false
}

# Response (400):
{
    "errors": {
        "age": ["Must be between 0 and 120."]
    }
}


# ============================================================================
# TEST CASE 6: Predict Risk - Invalid Gender
# ============================================================================
# Description: Gender not in allowed values
# Expected: 400 Bad Request with validation error

# Request:
POST /api/risk/predict
Content-Type: application/json

{
    "patient_id": "P001",
    "age": 45,
    "gender": "Unknown",
    "bmi": 28.5,
    "blood_pressure": 130,
    "cholesterol": 200,
    "glucose": 105,
    "smoker": false,
    "history_of_heart_disease": false
}

# Response (400):
{
    "errors": {
        "gender": ["Must be one of: Male, Female, Other"]
    }
}


# ============================================================================
# TEST CASE 7: Predict Risk - Invalid Type
# ============================================================================
# Description: Field has wrong data type (string instead of number)
# Expected: 400 Bad Request with validation error

# Request:
POST /api/risk/predict
Content-Type: application/json

{
    "patient_id": "P001",
    "age": "forty-five",
    "gender": "Male",
    "bmi": 28.5,
    "blood_pressure": 130,
    "cholesterol": 200,
    "glucose": 105,
    "smoker": false,
    "history_of_heart_disease": false
}

# Response (400):
{
    "errors": {
        "age": ["Not a valid integer."]
    }
}


# ============================================================================
# TEST CASE 8: Predict Risk (Async) - Valid Request
# ============================================================================
# Description: Valid async risk prediction request
# Expected: 202 Accepted with task ID

# Request:
POST /api/risk/predict-async
Content-Type: application/json

{
    "patient_id": "P001",
    "age": 45,
    "gender": "Male",
    "bmi": 28.5,
    "blood_pressure": 130,
    "cholesterol": 200,
    "glucose": 105,
    "smoker": false,
    "history_of_heart_disease": false
}

# Response (202):
{
    "task_id": "abc123def456-xyz789-12345678",
    "status": "Task submitted",
    "message": "Prediction is being processed asynchronously"
}


# ============================================================================
# TEST CASE 9: Low Risk Patient
# ============================================================================
# Description: Patient with low risk profile
# Expected: 200 OK with "Low" risk level

# Request:
POST /api/risk/predict
Content-Type: application/json

{
    "patient_id": "P002",
    "age": 30,
    "gender": "Female",
    "bmi": 22.0,
    "blood_pressure": 110,
    "cholesterol": 150,
    "glucose": 90,
    "smoker": false,
    "history_of_heart_disease": false
}

# Response (200):
{
    "patient_id": "P002",
    "risk_score": 0.15,
    "risk_level": "Low",
    "confidence": 0.92,
    "explanation": {...},
    "timestamp": "2024-01-15T10:31:00.123456"
}


# ============================================================================
# TEST CASE 10: High Risk Patient
# ============================================================================
# Description: Patient with high risk profile
# Expected: 200 OK with "High" risk level

# Request:
POST /api/risk/predict
Content-Type: application/json

{
    "patient_id": "P003",
    "age": 70,
    "gender": "Male",
    "bmi": 35.0,
    "blood_pressure": 160,
    "cholesterol": 250,
    "glucose": 150,
    "smoker": true,
    "history_of_heart_disease": true
}

# Response (200):
{
    "patient_id": "P003",
    "risk_score": 0.85,
    "risk_level": "High",
    "confidence": 0.90,
    "explanation": {...},
    "timestamp": "2024-01-15T10:31:15.123456"
}


# ============================================================================
# RUNNING THESE TESTS
# ============================================================================
# 1. Using curl:
#    - Save test requests to test_api.sh
#    - Run: bash test_api.sh

# 2. Using Postman:
#    - Import requests into Postman collection
#    - Run collection with environment variables

# 3. Using pytest:
#    - Create test_api.py
#    - Run: pytest test_api.py -v

# 4. Using Thunder Client (VS Code):
#    - Import test cases
#    - Run tests in sequence

# ============================================================================
# PERFORMANCE TESTING
# ============================================================================
# Load testing with Apache Bench:
# ab -n 1000 -c 10 -H "Content-Type: application/json" \
#    -p request.json http://localhost:5000/api/risk/predict

# Load testing with wrk:
# wrk -t4 -c100 -d30s -s script.lua http://localhost:5000/api/risk/predict

# ============================================================================
