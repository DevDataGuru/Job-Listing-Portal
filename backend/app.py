# backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from config import config
from db import init_db, db
from routes.job_routes import jobs_bp
import os

def create_app(config_name=None):
    """Application factory pattern"""
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions - Simple CORS setup for development
    CORS(app, 
         origins=["http://localhost:3000", "http://127.0.0.1:3000"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=False)
    
    # Initialize database
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(jobs_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Job Listing API is running',
            'version': '1.0.0'
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({'error': 'Method not allowed'}), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

# For development server
if __name__ == '__main__':
    app = create_app('development')
    
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
        print("Database initialized!")
    
    print("Starting Flask development server...")
    print("API Health Check: http://localhost:5000/api/health")
    print("Jobs API: http://localhost:5000/api/jobs")
    
    app.run(host='0.0.0.0', port=5000, debug=True)