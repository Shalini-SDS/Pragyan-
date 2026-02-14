"""
Flask Extensions Module

This module initializes Flask extensions that are used across the application.
Extensions are initialized in app.py after the application is created.

Extensions initialized:
    - PyMongo: MongoDB integration
    - Celery: Distributed task queue for async operations
    - SocketIO: Real-time communication for alerts and updates
"""

from flask_pymongo import PyMongo
from celery import Celery
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO

# PyMongo instance for MongoDB operations
mongo = PyMongo()

# JWT instance for authentication
jwt = JWTManager()

# SocketIO instance for real-time communication
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode='threading',
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25
)


def make_celery(app_name):
    """
    Create and configure Celery instance.
    
    This function creates a Celery application with Redis as both
    the message broker and result backend.
    
    Args:
        app_name (str): Name of the application (usually app.import_name)
        
    Returns:
        Celery: Configured Celery instance
        
    Environment Variables Used:
        - REDIS_URL: Redis connection string (default: redis://localhost:6379/0)
    """
    import os
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # Create Celery instance with Redis as broker and backend
    celery_app = Celery(
        app_name,
        broker=redis_url,
        backend=redis_url
    )
    
    return celery_app
