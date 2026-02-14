"""
Configuration Module

This module loads environment variables and provides configuration classes
for different environments (development, production, testing).

Environment variables are loaded from .env file using python-dotenv.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """
    Base Configuration Class
    
    Contains common configuration settings used across all environments.
    Inheriting classes can override values for specific environments.
    """
    
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key')
    
    # Database Configuration
    MONGO_URI = os.environ.get(
        'MONGO_URI', 
        'mongodb://localhost:27017/healthcare_db'
    )
    
    # Redis Configuration (for Celery message broker)
    REDIS_URL = os.environ.get(
        'REDIS_URL',
        'redis://localhost:6379/0'
    )
    
    # Model Configuration
    MODEL_PATH = os.environ.get(
        'MODEL_PATH',
        'models/risk_model.joblib'
    )
    DEPARTMENT_MODEL_PATH = os.environ.get(
        'DEPARTMENT_MODEL_PATH',
        'models/department_model.joblib'
    )
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    
    # Celery Configuration
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    # Frontend Configuration
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')


class DevelopmentConfig(Config):
    """Development Configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production Configuration"""
    DEBUG = False
    TESTING = False


class TestingConfig(Config):
    """Testing Configuration"""
    DEBUG = True
    TESTING = True
    MONGO_URI = 'mongodb://localhost:27017/healthcare_db_test'
