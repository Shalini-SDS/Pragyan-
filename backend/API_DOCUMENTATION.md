# Healthcare Risk Prediction API - Complete Documentation

## Overview

This is a production-grade REST API for healthcare risk prediction powered by Machine Learning (Random Forest) with SHAP-based model explainability.

**Base URL:** `http://localhost:5000`

**API Version:** 1.0

**Authentication:** None (add JWT in production)

## Response Format

All responses are in JSON format.

### Success Response (200, 202)
```json
{
    "key": "value",
    "data": {...}
}
```

### Error Response (4xx, 5xx)
```json
{
    "error": "Error message",
    "status_code": 400,
    "details": "Additional details if available"
}
```

### Validation Error Response (400)
```json
{
    "errors": {
        "field_name": ["Error message for this field"]
    }
}
```

## Endpoints

### 1. Health Check

Check if the API is running and healthy.

**Endpoint:** `GET /health`

**Request:**
```bash
curl http://localhost:5000/health
```

**Response (200):**
```json
{
    "status": "healthy",
    "service": "Healthcare Risk Prediction API"
}
```

**Status Codes:**
- `200 OK` - Service is healthy

---

### 2. Get Patient Information

Retrieve patient data from the database.

**Endpoint:** `GET /api/patient/<patient_id>`

**Parameters:**
- `patient_id` (path, string, required) - Unique patient identifier

**Request:**
```bash
curl http://localhost:5000/api/patient/P001
```

**Response (200):**
```json
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
```

**Response (404):**
```json
{
    "error": "Patient with ID 'P001' not found"
}
```

**Status Codes:**
- `200 OK` - Patient found
- `404 Not Found` - Patient not found
- `500 Internal Server Error` - Server error

---

### 3. Predict Risk (Synchronous)

Perform risk prediction for a patient (synchronous, returns immediately).

**Endpoint:** `POST /api/risk/predict`

**Request Body Schema:**
```json
{
    "patient_id": "string (required)",
    "age": "integer (required, 0-120)",
    "gender": "string (required, one of: Male, Female, Other)",
    "bmi": "number (required)",
    "blood_pressure": "integer (required)",
    "cholesterol": "integer (required)",
    "glucose": "integer (required)",
    "smoker": "boolean (required)",
    "history_of_heart_disease": "boolean (required)"
}
```

**Request:**
```bash
curl -X POST http://localhost:5000/api/risk/predict \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P001",
    "age": 45,
    "gender": "Male",
    "bmi": 28.5,
    "blood_pressure": 130,
    "cholesterol": 200,
    "glucose": 105,
    "smoker": false,
    "history_of_heart_disease": false
  }'
```

**Response (200):**
```json
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
    "timestamp": "2024-01-15T10:30:00.000000"
}
```

**Response Fields:**
- `patient_id` - Patient identifier
- `risk_score` - Probability of high risk (0.0 to 1.0)
- `risk_level` - Risk category:
  - "Low" (score < 0.3)
  - "Moderate" (0.3 ≤ score < 0.7)
  - "High" (score ≥ 0.7)
- `confidence` - Model confidence in the prediction (0.0 to 1.0)
- `explanation` - SHAP values for each feature:
  - Positive values increase risk
  - Negative values decrease risk
  - Magnitude indicates importance
- `timestamp` - UTC timestamp of prediction

**Response (400) - Validation Error:**
```json
{
    "errors": {
        "age": ["Missing data for required field."],
        "gender": ["Not a valid choice."]
    }
}
```

**Response (500) - Server Error:**
```json
{
    "error": "Prediction error: Model file not found",
    "status_code": 500
}
```

**Status Codes:**
- `200 OK` - Prediction successful
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server error

---

### 4. Predict Risk (Asynchronous)

Submit a risk prediction request for asynchronous processing (returns immediately with task ID).

**Endpoint:** `POST /api/risk/predict-async`

**Request Body:** (same as synchronous)

**Request:**
```bash
curl -X POST http://localhost:5000/api/risk/predict-async \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "P001",
    "age": 45,
    "gender": "Male",
    "bmi": 28.5,
    "blood_pressure": 130,
    "cholesterol": 200,
    "glucose": 105,
    "smoker": false,
    "history_of_heart_disease": false
  }'
```

**Response (202) - Accepted:**
```json
{
    "task_id": "abc123def456-xyz789-12345678",
    "status": "Task submitted",
    "message": "Prediction is being processed asynchronously"
}
```

**Response Fields:**
- `task_id` - Unique task identifier (use to check status later)
- `status` - Task status message
- `message` - Additional information

**Response (400) - Validation Error:**
```json
{
    "errors": {
        "patient_id": ["Missing data for required field."]
    }
}
```

**Response (500) - Server Error:**
```json
{
    "error": "Failed to submit task: Connection error",
    "status_code": 500
}
```

**Status Codes:**
- `202 Accepted` - Task submitted successfully
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server error

**Checking Task Status:**

Use Flower UI or Celery API to check task status:
```bash
# Using Flower (if running on port 5555)
http://localhost:5555/task/abc123def456-xyz789-12345678

# Or via Redis CLI
redis-cli HGETALL celery-task-meta-abc123def456-xyz789-12345678
```

---

## Request Validation

All requests are validated against strict schemas.

### Patient Data Validation Rules

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| patient_id | String | Yes | Non-empty |
| age | Integer | Yes | 0-120 |
| gender | String | Yes | Male, Female, or Other |
| bmi | Float | Yes | Any positive number |
| blood_pressure | Integer | Yes | Positive |
| cholesterol | Integer | Yes | Positive |
| glucose | Integer | Yes | Positive |
| smoker | Boolean | Yes | true or false |
| history_of_heart_disease | Boolean | Yes | true or false |

### Validation Error Examples

**Missing Required Field:**
```json
{
    "errors": {
        "age": ["Missing data for required field."]
    }
}
```

**Invalid Type:**
```json
{
    "errors": {
        "age": ["Not a valid integer."]
    }
}
```

**Out of Range:**
```json
{
    "errors": {
        "age": ["Must be between 0 and 120."]
    }
}
```

**Invalid Choice:**
```json
{
    "errors": {
        "gender": ["Must be one of: Male, Female, Other"]
    }
}
```

---

## SHAP Explanation Guide

The `explanation` field in prediction responses contains SHAP values for each feature.

### Understanding SHAP Values

- **Positive values** increase the predicted risk
- **Negative values** decrease the predicted risk
- **Magnitude** indicates how much that feature impacts the prediction
- **Sum** of all SHAP values plus base value ≈ model output

### Example Interpretation

```json
"explanation": {
    "age": 0.12,                           // High age increases risk
    "smoker": 0.20,                        // Smoking significantly increases risk
    "history_of_heart_disease": 0.25,     // Heart disease history very significant
    "glucose": 0.10,                       // Elevated glucose increases risk
    "cholesterol": 0.15,                   // High cholesterol increases risk
    "blood_pressure": 0.05,                // Blood pressure slightly increases risk
    "bmi": 0.08,                           // High BMI increases risk
    "gender": -0.02                        // Certain gender slightly decreases risk
}
```

**Interpretation:**
- This patient has high risk largely due to heart disease history, smoking, and high cholesterol
- The combination of multiple risk factors elevates the overall risk score

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 202 | Accepted | Async task submitted |
| 400 | Bad Request | Validation error, missing fields |
| 404 | Not Found | Patient/resource not found |
| 500 | Server Error | Model loading error, database connection error |

### Error Response Structure

```json
{
    "error": "Description of what went wrong",
    "status_code": 400,
    "details": "Additional context if available"
}
```

### Troubleshooting

**"Model file not found"**
- Check MODEL_PATH in .env
- Ensure trained model is at the specified location
- Verify file permissions

**"Patient not found"**
- Use correct patient_id
- Ensure patient exists in database
- Check MongoDB connection

**"Connection refused"**
- Verify MongoDB is running
- Verify Redis is running (if using async)
- Check MONGO_URI and REDIS_URL in .env

---

## Rate Limiting (Recommended)

For production, implement rate limiting:

```python
# Example: Limit to 100 requests per minute per IP
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per minute"]
)
```

---

## Authentication (Recommended)

For production, implement JWT authentication:

```python
# Add to all endpoints
@app.route('/api/risk/predict', methods=['POST'])
@require_jwt
def predict(data):
    ...
```

---

## Deployment Examples

### Using cURL

```bash
# Basic prediction
curl -X POST http://api.example.com/api/risk/predict \
  -H "Content-Type: application/json" \
  -d @patient_data.json

# With authentication (if implemented)
curl -X POST http://api.example.com/api/risk/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @patient_data.json
```

### Using Python Requests

```python
import requests

url = "http://localhost:5000/api/risk/predict"
patient_data = {
    "patient_id": "P001",
    "age": 45,
    "gender": "Male",
    "bmi": 28.5,
    "blood_pressure": 130,
    "cholesterol": 200,
    "glucose": 105,
    "smoker": False,
    "history_of_heart_disease": False
}

response = requests.post(url, json=patient_data)
result = response.json()

print(f"Risk Level: {result['risk_level']}")
print(f"Risk Score: {result['risk_score']:.1%}")
```

### Using JavaScript/Fetch

```javascript
const patientData = {
    patient_id: "P001",
    age: 45,
    gender: "Male",
    bmi: 28.5,
    blood_pressure: 130,
    cholesterol: 200,
    glucose: 105,
    smoker: false,
    history_of_heart_disease: false
};

fetch('http://localhost:5000/api/risk/predict', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(patientData)
})
.then(response => response.json())
.then(data => console.log('Risk Level:', data.risk_level));
```

---

## Support and Contact

For issues, questions, or feature requests, contact the development team.

**Documentation:** See README.md

**Setup Guide:** See SETUP.py

**Code Examples:** See examples/ directory
