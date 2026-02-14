# Healthcare Risk Prediction System - Backend API

A production-grade Flask backend for AI-powered healthcare risk prediction using Random Forest and SHAP explainability.

## Features

- **REST API** for patient risk prediction
- **Machine Learning** using scikit-learn Random Forest
- **Model Explainability** with SHAP (SHapley Additive exPlanations)
- **Async Processing** with Celery + Redis
- **MongoDB** for persistent data storage
- **Clean Architecture** with modular design
- **Error Handling** and request validation
- **Environment-based Configuration**

## Tech Stack

- **Flask 3.0.0** - Web framework
- **MongoDB** - NoSQL database (via PyMongo)
- **scikit-learn 1.3.2** - ML library
- **SHAP 0.44.0** - Model explainability
- **Celery 5.3.6** - Distributed task queue
- **Redis 5.0.1** - Message broker and cache
- **Marshmallow 3.20.1** - Schema validation
- **joblib 1.3.2** - Model serialization

## Project Structure

```
backend/
├── app.py                    # Flask application factory
├── config.py               # Configuration management
├── extensions.py           # Flask extensions initialization
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
│
├── api/                    # API routes (Blueprints)
│   ├── __init__.py
│   ├── patient_routes.py   # Patient endpoints
│   └── risk_routes.py      # Risk prediction endpoints
│
├── services/               # Business logic
│   ├── patient_service.py  # Patient data operations
│   └── risk_service.py     # Risk prediction orchestration
│
├── models/                 # Data models & schemas
│   └── patient_model.py    # Marshmallow schemas for validation
│
├── database/               # Database operations
│   └── mongo.py           # MongoDB utility functions
│
├── risk_engine/           # ML prediction logic
│   ├── model_loader.py    # Load trained Random Forest model
│   ├── preprocess.py      # Data preprocessing
│   ├── predictor.py       # Risk prediction
│   └── explain.py         # SHAP explanations
│
├── tasks/                 # Async tasks with Celery
│   ├── celery_app.py      # Celery configuration
│   └── risk_tasks.py      # Async risk prediction tasks
│
└── utils/                 # Utility functions
    └── validators.py      # Request validation decorators
```

## Installation

### 1. Clone and Setup

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your values
# - MONGO_URI: MongoDB connection string
# - REDIS_URL: Redis server URL
# - MODEL_PATH: Path to your trained Random Forest model
# - SECRET_KEY: Flask secret key for sessions
```

### 3. Setup MongoDB

```bash
# Local MongoDB (make sure MongoDB is running)
# Default: mongodb://localhost:27017/healthcare_db

# Or use MongoDB Atlas
# Update MONGO_URI in .env
```

### 4. Setup Redis (for async tasks)

```bash
# Local Redis (make sure Redis is running)
# Default: redis://localhost:6379/0
```

### 5. Train/Prepare Model

Place your trained Random Forest model at the path specified in `MODEL_PATH` (.env).

The model should be saved using joblib:
```python
import joblib
joblib.dump(trained_model, 'risk_engine/model.joblib')
```

## Running the Application

### Development Server

```bash
python app.py
```

Server runs on `http://localhost:5000`

### Production Deployment

```bash
gunicorn --workers 4 --bind 0.0.0.0:5000 app:create_app()
```

### Celery Worker (for async tasks)

```bash
# Terminal 1: Start Celery worker
celery -A tasks.celery_app worker --loglevel=info

# Terminal 2: (Optional) Start Flower monitoring
celery -A tasks.celery_app flower
```

## API Endpoints

### Health Check

```
GET /health
Response: { "status": "healthy", "service": "Healthcare Risk Prediction API" }
```

### Get Patient Information

```
GET /api/patient/<patient_id>

Response (200):
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

Response (404):
{ "error": "Patient not found" }
```

### Predict Risk (Synchronous)

```
POST /api/risk/predict

Request Body:
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

Response (200):
{
    "patient_id": "P001",
    "risk_score": 0.65,
    "risk_level": "Moderate",
    "confidence": 0.85,
    "explanation": {
        "age": 0.12,
        "bmi": 0.08,
        "cholesterol": 0.15,
        ...
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
}

Response (400): Validation error
{ "errors": { "age": ["Missing data for required field."] } }

Response (500): Server error
{ "error": "Internal server error", "status_code": 500 }
```

### Predict Risk (Asynchronous)

```
POST /api/risk/predict-async

Request Body: (same as synchronous)

Response (202):
{
    "task_id": "abc123def456",
    "status": "Task submitted"
}

# Check task status with Flower or Celery directly
```

## Request Validation

All request bodies are validated using Marshmallow schemas defined in `models/patient_model.py`.

**Patient Data Schema:**
- `patient_id` (string, required)
- `age` (integer, required, 0-120)
- `gender` (string, required, one of: "Male", "Female", "Other")
- `bmi` (float, required)
- `blood_pressure` (integer, required)
- `cholesterol` (integer, required)
- `glucose` (integer, required)
- `smoker` (boolean, required)
- `history_of_heart_disease` (boolean, required)

## Architecture Overview

### Clean Modular Architecture

```
Request → API Routes → Services → Risk Engine → Database
            ↓
         Validation
            ↓
         Error Handlers
```

**API Layer** (`api/`)
- Handles HTTP requests and responses
- Routes requests to appropriate services
- Returns JSON responses with proper status codes

**Service Layer** (`services/`)
- Orchestrates business logic
- Coordinates between API and lower layers
- Handles data transformations

**Risk Engine** (`risk_engine/`)
- Machine learning prediction logic
- Data preprocessing
- Model loading and inference
- SHAP explainability

**Database Layer** (`database/`)
- MongoDB operations
- Data persistence

**Utilities** (`utils/`)
- Request validation decorators
- Helper functions

### Error Handling

Global error handlers are registered in `app.py`:
- 404: Resource not found
- 500: Internal server error
- 400: Bad request
- Generic exception handler

Validation errors are caught by the `@validate_schema` decorator in routes.

### Async Processing

Celery is configured for async task processing:
- Task broker: Redis
- Result backend: Redis
- Task: `predict_risk_async` for background predictions

## Configuration

Configuration is managed through:
1. **Environment Variables** (`.env` file)
2. **Config Class** (`config.py`)

Environment variables:
- `FLASK_ENV`: development/production
- `SECRET_KEY`: Flask secret key
- `MONGO_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `MODEL_PATH`: Path to trained model

## Model Explainability

SHAP (SHapley Additive exPlanations) provides feature importance for predictions:

- Each prediction includes SHAP values
- Shows contribution of each feature to the risk score
- Helps doctors understand the model's decision
- Enables trust and transparency

## Database Schema

### Collections

**patients**
```json
{
    "_id": ObjectId,
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

**predictions**
```json
{
    "_id": ObjectId,
    "patient_id": "P001",
    "risk_score": 0.65,
    "risk_level": "Moderate",
    "confidence": 0.85,
    "explanation": { "age": 0.12, ... },
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing

Example test requests using curl:

```bash
# Health check
curl http://localhost:5000/health

# Get patient
curl http://localhost:5000/api/patient/P001

# Predict risk
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

# Predict risk (async)
curl -X POST http://localhost:5000/api/risk/predict-async \
  -H "Content-Type: application/json" \
  -d '{...}'
```

## Scaling Considerations

1. **Database**: Consider MongoDB Atlas for managed hosting
2. **Caching**: Add Redis caching for frequently accessed data
3. **Load Balancing**: Use nginx or similar for multiple workers
4. **Model Serving**: Consider MLflow or BentoML for model management
5. **Monitoring**: Implement logging and monitoring with ELK or similar
6. **Docker**: Containerize for consistent deployment

## Security

1. Always change `SECRET_KEY` in production
2. Use environment variables for sensitive data
3. Validate all inputs
4. Implement authentication (JWT, OAuth)
5. Add rate limiting for API endpoints
6. Use HTTPS in production
7. Keep dependencies updated

## Future Enhancements

1. Add user authentication and authorization
2. Implement API key management
3. Add request logging and analytics
4. Integrate with EHR systems
5. Add support for multiple prediction models
6. Implement model versioning
7. Add data validation against medical standards
8. Implement audit logging for compliance

## Contributing

1. Follow PEP 8 style guide
2. Add docstrings to functions
3. Include error handling
4. Test changes before committing
5. Update documentation

## License

Proprietary - Healthcare System

## Contact

For issues or questions, contact the development team.
