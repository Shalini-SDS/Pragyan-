"""
Healthcare Risk Prediction System - Setup Guide

This guide provides step-by-step instructions for setting up and running
the production-grade healthcare risk prediction backend.
"""

# ============================================================================
# PREREQUISITES
# ============================================================================
# 1. Python 3.8+
# 2. MongoDB (local or Atlas)
# 3. Redis (for Celery async tasks)
# 4. Trained Random Forest model (joblib format)

# ============================================================================
# SETUP INSTRUCTIONS
# ============================================================================

# 1. Clone repository and navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file from template
cp .env.example .env

# 6. Edit .env with your configuration
# - MONGO_URI: Set your MongoDB connection string
# - REDIS_URL: Set your Redis connection string
# - MODEL_PATH: Path to your trained model
# - SECRET_KEY: Generate a secure random key for production

# 7. Verify MongoDB connection
# Make sure MongoDB is running and accessible

# 8. Verify Redis connection
# Make sure Redis is running and accessible

# 9. Prepare trained model
# Place your trained Random Forest model at the MODEL_PATH location
# Example:
#   import joblib
#   joblib.dump(trained_model, 'risk_engine/model.joblib')

# ============================================================================
# RUNNING THE APPLICATION
# ============================================================================

# Option 1: Development Server
python app.py
# Runs on http://localhost:5000

# Option 2: Production Server with Gunicorn (4 workers)
pip install gunicorn
gunicorn --workers 4 --bind 0.0.0.0:5000 'app:create_app()'

# Option 3: With environment-specific config
export FLASK_ENV=production
export SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')
gunicorn --workers 4 --bind 0.0.0.0:5000 'app:create_app()'

# ============================================================================
# RUNNING CELERY WORKER (for async predictions)
# ============================================================================

# Terminal 1: Start Celery worker
celery -A tasks.celery_app worker --loglevel=info --concurrency=4

# Terminal 2 (Optional): Start Flower UI for monitoring
pip install flower
celery -A tasks.celery_app flower --port=5555

# Access Flower UI at http://localhost:5555

# ============================================================================
# API TESTING
# ============================================================================

# Health Check
curl http://localhost:5000/health

# Get Patient Information
curl http://localhost:5000/api/patient/P001

# Synchronous Risk Prediction
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

# Asynchronous Risk Prediction
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

# ============================================================================
# DOCKER DEPLOYMENT
# ============================================================================

# Create Dockerfile (example)
# FROM python:3.11-slim
# WORKDIR /app
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
# COPY . .
# ENV FLASK_APP=app.py
# EXPOSE 5000
# CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:5000", "app:create_app()"]

# Build and run
# docker build -t healthcare-risk-api .
# docker run -p 5000:5000 --env-file .env healthcare-risk-api

# ============================================================================
# PRODUCTION CHECKLIST
# ============================================================================

# Security
# [ ] Set strong SECRET_KEY
# [ ] Enable HTTPS/SSL
# [ ] Set FLASK_ENV=production
# [ ] Disable debug mode
# [ ] Implement authentication
# [ ] Add rate limiting
# [ ] Validate all inputs
# [ ] Keep dependencies updated

# Performance
# [ ] Use Gunicorn with multiple workers
# [ ] Configure connection pooling
# [ ] Add caching layer
# [ ] Monitor response times
# [ ] Load test the application

# Reliability
# [ ] Configure logging
# [ ] Set up error tracking
# [ ] Monitor API health
# [ ] Implement backup strategy
# [ ] Set up alerting

# Compliance
# [ ] Encrypt sensitive data
# [ ] Implement audit logging
# [ ] Ensure data retention policies
# [ ] Comply with medical data regulations
# [ ] Document API changes

# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# Issue: Model file not found
# Solution: Check MODEL_PATH in .env and verify file exists

# Issue: MongoDB connection refused
# Solution: Verify MONGO_URI is correct and MongoDB is running

# Issue: Redis connection refused
# Solution: Verify REDIS_URL is correct and Redis is running

# Issue: Celery tasks not executing
# Solution: Start Celery worker: celery -A tasks.celery_app worker --loglevel=info

# Issue: SHAP calculation taking too long
# Solution: Use TreeExplainer (already optimized for Random Forest)

# Issue: Out of memory with large datasets
# Solution: Process data in batches, use pagination

# ============================================================================
# MONITORING AND LOGGING
# ============================================================================

# Access application logs
# Development: Check console output
# Production: Configure logging to file or service

# Monitor with Flower (Celery UI)
# http://localhost:5555

# Monitor with New Relic, DataDog, or similar APM
# Add APM agent to requirements.txt
# Configure in app.py

# ============================================================================
# SCALING CONSIDERATIONS
# ============================================================================

# Horizontal Scaling
# 1. Use load balancer (nginx, HAProxy)
# 2. Run multiple API instances
# 3. Use managed database (MongoDB Atlas)
# 4. Use managed Redis (AWS ElastiCache, etc.)
# 5. Containerize with Docker

# Vertical Scaling
# 1. Increase Gunicorn workers
# 2. Increase Celery worker concurrency
# 3. Increase server resources

# Database Optimization
# 1. Add indexes to collections
# 2. Use database replication
# 3. Enable sharding for large datasets

# ============================================================================
# REFERENCES
# ============================================================================

# Flask Documentation: https://flask.palletsprojects.com/
# PyMongo Documentation: https://pymongo.readthedocs.io/
# Celery Documentation: https://docs.celeryproject.io/
# SHAP Documentation: https://shap.readthedocs.io/
# scikit-learn Documentation: https://scikit-learn.org/

# ============================================================================
