# backend/db.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

def init_db(app):
    """Initialize database with Flask app"""
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database tables created successfully!")

def reset_db(app):
    """Reset database - USE WITH CAUTION"""
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("Database reset completed!")