"""
Flask Application Factory

This module implements the Flask application factory pattern for the 
healthcare risk prediction system. It initializes all extensions, 
configuration, and blueprints.

Architecture:
    - Config: Configuration management via config.py and .env
    - Extensions: Flask extensions initialization (MongoDB, Celery, SocketIO)
    - Blueprints: Modular API route organization
    - Error Handlers: Centralized error handling
    - SocketIO: Real-time communication for alerts
"""

from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import mongo, make_celery, jwt, socketio
from api import api_bp
from database.mongo import initialize_indexes
from socket_service import register_socket_events


def create_app(config_class=Config):
    """
    Application factory function.
    
    Creates and configures the Flask application with:
    - Configuration from config_class
    - MongoDB integration
    - CORS support
    - API blueprints
    - Error handlers
    
    Args:
        config_class: Configuration class (default: Config)
        
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config_class)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": config_class.CORS_ORIGINS}})
    
    # Initialize extensions
    mongo.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app)
    
    # Initialize Celery (optional, for async tasks)
    celery = make_celery(app.import_name)
    celery.conf.update(app.config)
    
    # Register Socket.IO events
    register_socket_events(socketio)
    
    # Initialize database indexes
    with app.app_context():
        try:
            initialize_indexes()
        except Exception as e:
            print(f"Warning: Could not initialize indexes: {e}")
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Register error handlers
    register_error_handlers(app)
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def index():
        """Root endpoint with API overview."""
        return jsonify({
            "message": "Welcome to the Healthcare Risk Prediction API",
            "features": [
                {
                    "name": "Health Check",
                    "endpoint": "/health",
                    "method": "GET",
                    "description": "Monitor service status"
                },
                {
                    "name": "Patient Data",
                    "endpoint": "/api/patient/<patient_id>",
                    "method": "GET",
                    "description": "Retrieve patient information by ID"
                },
                {
                    "name": "Risk Prediction (Sync)",
                    "endpoint": "/api/risk/predict",
                    "method": "POST",
                    "description": "Perform synchronous risk prediction with SHAP explanations"
                },
                {
                    "name": "Risk Prediction (Async)",
                    "endpoint": "/api/risk/predict-async",
                    "method": "POST",
                    "description": "Submit asynchronous risk prediction task"
                }
            ],
            "documentation": "/api/docs (if available)"
        }), 200

    # Favicon endpoint to avoid 404
    @app.route('/favicon.ico')
    def favicon():
        return '', 204
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint for monitoring."""
        return jsonify({
            "status": "healthy",
            "service": "Healthcare Risk Prediction API"
        }), 200
    
    return app


def register_error_handlers(app):
    """
    Register global error handlers for the application.
    
    Handles:
    - 404 Not Found
    - 500 Internal Server Error
    - 400 Bad Request
    - Generic exceptions
    
    Args:
        app (Flask): Flask application instance
    """
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return jsonify({
            "error": "Resource not found",
            "status_code": 404
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        return jsonify({
            "error": "Internal server error",
            "status_code": 500
        }), 500
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 errors."""
        return jsonify({
            "error": "Bad request",
            "status_code": 400
        }), 400
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        """Handle unexpected exceptions."""
        return jsonify({
            "error": "An unexpected error occurred",
            "details": str(error),
            "status_code": 500
        }), 500

if __name__ == '__main__':
    # Create and run the application
    app = create_app()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
