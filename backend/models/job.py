# backend/models/job.py
from db import db
from datetime import datetime
from sqlalchemy import UniqueConstraint

class Job(db.Model):
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    posting_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    job_type = db.Column(db.String(50), nullable=False, default='Full-time')
    tags = db.Column(db.Text)  # Comma-separated tags
    description = db.Column(db.Text)  # Optional job description
    url = db.Column(db.String(500))  # Original job posting URL
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Add unique constraint to prevent exact duplicates
    __table_args__ = (UniqueConstraint('title', 'company', 'location', name='unique_job'),)
    
    def __repr__(self):
        return f'<Job {self.title} at {self.company}>'
    
    def to_dict(self):
        """Convert job object to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'title': self.title,
            'company': self.company,
            'location': self.location,
            'posting_date': self.posting_date.isoformat() if self.posting_date else None,
            'job_type': self.job_type,
            'tags': self.tags.split(',') if self.tags else [],
            'description': self.description,
            'url': self.url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create job object from dictionary"""
        # Handle tags - convert list to comma-separated string
        tags = data.get('tags', [])
        if isinstance(tags, list):
            tags = ','.join(tags)
        
        # Handle posting_date
        posting_date = data.get('posting_date')
        if isinstance(posting_date, str):
            try:
                posting_date = datetime.fromisoformat(posting_date.replace('Z', '+00:00'))
            except:
                posting_date = datetime.utcnow()
        elif posting_date is None:
            posting_date = datetime.utcnow()
            
        return cls(
            title=data.get('title', ''),
            company=data.get('company', ''),
            location=data.get('location', ''),
            posting_date=posting_date,
            job_type=data.get('job_type', 'Full-time'),
            tags=tags,
            description=data.get('description', ''),
            url=data.get('url', '')
        )
    
    def validate(self):
        """Validate required fields"""
        errors = []
        if not self.title or self.title.strip() == '':
            errors.append('Title is required')
        if not self.company or self.company.strip() == '':
            errors.append('Company is required')
        if not self.location or self.location.strip() == '':
            errors.append('Location is required')
        
        valid_job_types = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary']
        if self.job_type not in valid_job_types:
            errors.append(f'Job type must be one of: {", ".join(valid_job_types)}')
            
        return errors