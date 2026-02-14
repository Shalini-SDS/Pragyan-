"""
Celery Application Configuration

This module initializes the Celery task queue for asynchronous task processing.

Celery Configuration:
    - Broker: Redis (message broker)
    - Backend: Redis (result backend for task results)
    - Task serialization: JSON
    - Result expiration: 1 hour

To run the Celery worker:
    celery -A tasks.celery_app worker --loglevel=info
"""

from extensions import make_celery

# Create Celery instance with configuration
celery = make_celery('healthcare_tasks')
