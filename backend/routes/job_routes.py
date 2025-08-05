# backend/routes/job_routes.py
from flask import Blueprint, request, jsonify
from models.job import Job
from db import db
from sqlalchemy import or_, desc, asc, and_
from datetime import datetime, timedelta

jobs_bp = Blueprint('jobs', __name__, url_prefix='/api/jobs')

# DATE FILTER PARSING HELPER FUNCTION
def parse_date_filter(date_filter_type, custom_date_from=None, custom_date_to=None):
    """Parse date filter and return date range"""
    today = datetime.now().date()
    
    if date_filter_type == 'today':
        return today, today
    elif date_filter_type == 'last_7_days':
        return today - timedelta(days=7), today
    elif date_filter_type == 'last_month':
        return today - timedelta(days=30), today
    elif date_filter_type == 'custom' and custom_date_from and custom_date_to:
        try:
            date_from = datetime.strptime(custom_date_from, '%Y-%m-%d').date()
            date_to = datetime.strptime(custom_date_to, '%Y-%m-%d').date()
            return date_from, date_to
        except ValueError:
            return None, None
    
    return None, None

# API ENDPOINT - GET ALL JOBS WITH FILTERING AND PAGINATION
@jobs_bp.route('/', methods=['GET'])
def get_jobs():
    """Get all jobs with optional filtering and sorting"""
    try:
        # BASE QUERY SETUP
        query = Job.query
        
        # EXTRACT FILTER PARAMETERS
        job_type = request.args.get('job_type')
        location = request.args.get('location')
        company = request.args.get('company')
        tags = request.args.get('tags')
        search = request.args.get('search')
        
        # DATE FILTERING PARAMETERS
        date_filter = request.args.get('date_filter')
        custom_date_from = request.args.get('date_from')
        custom_date_to = request.args.get('date_to')
        
        # APPLY FILTERS TO QUERY
        if job_type:
            query = query.filter(Job.job_type == job_type)
            
        if location:
            query = query.filter(Job.location.ilike(f'%{location}%'))
            
        if company:
            query = query.filter(Job.company.ilike(f'%{company}%'))
            
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
            tag_conditions = [Job.tags.ilike(f'%{tag}%') for tag in tag_list]
            query = query.filter(or_(*tag_conditions))
            
        if search:
            search_term = f'%{search}%'
            query = query.filter(
                or_(
                    Job.title.ilike(search_term),
                    Job.company.ilike(search_term),
                    Job.description.ilike(search_term)
                )
            )
        
        # APPLY DATE FILTERING
        if date_filter:
            date_from, date_to = parse_date_filter(date_filter, custom_date_from, custom_date_to)
            if date_from and date_to:
                date_from_dt = datetime.combine(date_from, datetime.min.time())
                date_to_dt = datetime.combine(date_to, datetime.max.time())
                query = query.filter(and_(
                    Job.posting_date >= date_from_dt,
                    Job.posting_date <= date_to_dt
                ))
        
        # APPLY SORTING
        sort = request.args.get('sort', 'posting_date_desc')
        
        if sort == 'posting_date_desc':
            query = query.order_by(desc(Job.posting_date))
        elif sort == 'posting_date_asc':
            query = query.order_by(asc(Job.posting_date))
        elif sort == 'title_asc':
            query = query.order_by(asc(Job.title))
        elif sort == 'title_desc':
            query = query.order_by(desc(Job.title))
        elif sort == 'company_asc':
            query = query.order_by(asc(Job.company))
        elif sort == 'company_desc':
            query = query.order_by(desc(Job.company))
        else:
            query = query.order_by(desc(Job.posting_date))
        
        # PAGINATION SETUP
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        per_page = min(per_page, 100)
        
        jobs = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        # RETURN PAGINATED RESULTS
        return jsonify({
            'jobs': [job.to_dict() for job in jobs.items],
            'total': jobs.total,
            'page': jobs.page,
            'pages': jobs.pages,
            'per_page': jobs.per_page,
            'has_next': jobs.has_next,
            'has_prev': jobs.has_prev,
            'total_pages': jobs.pages,
            'current_page': jobs.page,
            'items_per_page': jobs.per_page,
            'total_items': jobs.total
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch jobs: {str(e)}'}), 500

# API ENDPOINT - GET DYNAMIC FILTER OPTIONS
@jobs_bp.route('/filter-options', methods=['GET'])
def get_filter_options():
    """Get available filter options based on current filters (dynamic cascading filters)"""
    try:
        # EXTRACT CURRENT FILTER PARAMETERS
        job_type = request.args.get('job_type')
        location = request.args.get('location')
        company = request.args.get('company')
        tags = request.args.get('tags')
        search = request.args.get('search')
        
        # DATE FILTER PARAMETERS
        date_filter = request.args.get('date_filter')
        custom_date_from = request.args.get('date_from')
        custom_date_to = request.args.get('date_to')
        
        # BASE QUERY SETUP
        base_query = Job.query
        
        # APPLY COMMON FILTERS TO BASE QUERY
        if search:
            search_term = f'%{search}%'
            base_query = base_query.filter(
                or_(
                    Job.title.ilike(search_term),
                    Job.company.ilike(search_term),
                    Job.description.ilike(search_term)
                )
            )
        
        if tags:
            tag_list = [tag.strip() for tag in tags.split(',')]
            tag_conditions = [Job.tags.ilike(f'%{tag}%') for tag in tag_list]
            base_query = base_query.filter(or_(*tag_conditions))
        
        # APPLY DATE FILTER TO BASE QUERY
        if date_filter:
            date_from, date_to = parse_date_filter(date_filter, custom_date_from, custom_date_to)
            if date_from and date_to:
                date_from_dt = datetime.combine(date_from, datetime.min.time())
                date_to_dt = datetime.combine(date_to, datetime.max.time())
                base_query = base_query.filter(and_(
                    Job.posting_date >= date_from_dt,
                    Job.posting_date <= date_to_dt
                ))
        
        # BUILD SEPARATE QUERIES FOR EACH FILTER TYPE
        # COMPANIES QUERY - EXCLUDE COMPANY FILTER
        company_base_query = base_query
        if location:
            company_base_query = company_base_query.filter(Job.location.ilike(f'%{location}%'))
        if job_type:
            company_base_query = company_base_query.filter(Job.job_type == job_type)
        
        # LOCATIONS QUERY - EXCLUDE LOCATION FILTER
        location_base_query = base_query
        if company:
            location_base_query = location_base_query.filter(Job.company.ilike(f'%{company}%'))
        if job_type:
            location_base_query = location_base_query.filter(Job.job_type == job_type)
        
        # JOB TYPES QUERY - EXCLUDE JOB TYPE FILTER
        job_type_base_query = base_query
        if company:
            job_type_base_query = job_type_base_query.filter(Job.company.ilike(f'%{company}%'))
        if location:
            job_type_base_query = job_type_base_query.filter(Job.location.ilike(f'%{location}%'))
        
        # GET FILTER OPTIONS WITH COUNTS
        companies_data = db.session.query(
            Job.company,
            db.func.count(Job.id).label('count')
        ).filter(Job.id.in_(company_base_query.with_entities(Job.id))).group_by(Job.company).order_by(desc('count')).all()
        
        locations_data = db.session.query(
            Job.location,
            db.func.count(Job.id).label('count')
        ).filter(Job.id.in_(location_base_query.with_entities(Job.id))).group_by(Job.location).order_by(desc('count')).all()
        
        job_types_data = db.session.query(
            Job.job_type,
            db.func.count(Job.id).label('count')
        ).filter(Job.id.in_(job_type_base_query.with_entities(Job.id))).group_by(Job.job_type).order_by(desc('count')).all()
        
        # FORMAT RESULTS
        filtered_companies = [
            {'company': comp[0], 'count': comp[1]} 
            for comp in companies_data 
            if comp[0] and comp[0].strip() and comp[1] > 0
        ]
        
        filtered_locations = [
            {'location': loc[0], 'count': loc[1]} 
            for loc in locations_data 
            if loc[0] and loc[0].strip() and loc[1] > 0
        ]
        
        filtered_job_types = [
            {'type': jt[0], 'count': jt[1]} 
            for jt in job_types_data 
            if jt[0] and jt[0].strip() and jt[1] > 0
        ]
        
        return jsonify({
            'job_types': filtered_job_types,
            'companies': filtered_companies,
            'locations': filtered_locations
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch filter options: {str(e)}'}), 500

# API ENDPOINT - GET SINGLE JOB BY ID
@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Get a single job by ID"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
            
        return jsonify(job.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch job: {str(e)}'}), 500

# API ENDPOINT - CREATE NEW JOB
@jobs_bp.route('/', methods=['POST'])
def create_job():
    """Create a new job"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # SET DEFAULT POSTING DATE
        if 'posting_date' not in data or not data['posting_date']:
            data['posting_date'] = datetime.now().isoformat()
        
        # CREATE JOB FROM DATA
        job = Job.from_dict(data)
        
        # VALIDATE JOB DATA
        validation_errors = job.validate()
        if validation_errors:
            return jsonify({'error': 'Validation failed', 'details': validation_errors}), 400
        
        # CHECK FOR DUPLICATES
        existing_job = Job.query.filter_by(
            title=job.title,
            company=job.company,
            location=job.location
        ).first()
        
        if existing_job:
            return jsonify({
                'error': 'Job already exists',
                'existing_job_id': existing_job.id
            }), 409
        
        # SAVE TO DATABASE
        db.session.add(job)
        db.session.commit()
        
        return jsonify({
            'message': 'Job created successfully',
            'job': job.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create job: {str(e)}'}), 500

# API ENDPOINT - UPDATE EXISTING JOB
@jobs_bp.route('/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    """Update an existing job"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # UPDATE JOB FIELDS
        if 'title' in data:
            job.title = data['title']
        if 'company' in data:
            job.company = data['company']
        if 'location' in data:
            job.location = data['location']
        if 'job_type' in data:
            job.job_type = data['job_type']
        if 'tags' in data:
            tags = data['tags']
            if isinstance(tags, list):
                job.tags = ','.join(tags)
            else:
                job.tags = tags
        if 'description' in data:
            job.description = data['description']
        if 'url' in data:
            job.url = data['url']
        if 'posting_date' in data:
            posting_date = data['posting_date']
            if isinstance(posting_date, str):
                try:
                    job.posting_date = datetime.fromisoformat(posting_date.replace('Z', '+00:00'))
                except:
                    pass
        
        job.updated_at = datetime.utcnow()
        
        # VALIDATE UPDATED JOB
        validation_errors = job.validate()
        if validation_errors:
            return jsonify({'error': 'Validation failed', 'details': validation_errors}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'Job updated successfully',
            'job': job.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update job: {str(e)}'}), 500

# API ENDPOINT - DELETE JOB
@jobs_bp.route('/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        db.session.delete(job)
        db.session.commit()
        
        return jsonify({'message': 'Job deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete job: {str(e)}'}), 500

# API ENDPOINT - GET JOB STATISTICS
@jobs_bp.route('/stats', methods=['GET'])
def get_job_stats():
    """Get job statistics for dashboard and initial filter dropdowns"""
    try:
        total_jobs = Job.query.count()
        
        # GET JOB TYPES DISTRIBUTION
        job_types = db.session.query(
            Job.job_type, 
            db.func.count(Job.id).label('count')
        ).group_by(Job.job_type).order_by(desc('count')).all()
        
        # GET ALL LOCATIONS WITH COUNTS
        all_locations_with_counts = db.session.query(
            Job.location,
            db.func.count(Job.id).label('count')
        ).group_by(Job.location).order_by(desc('count'), Job.location).all()
        
        # GET ALL COMPANIES WITH COUNTS
        all_companies_with_counts = db.session.query(
            Job.company,
            db.func.count(Job.id).label('count')
        ).group_by(Job.company).order_by(desc('count'), Job.company).all()
        
        # FILTER OUT EMPTY VALUES AND CREATE CLEAN LISTS
        filtered_locations = [
            {'location': loc[0], 'count': loc[1]} 
            for loc in all_locations_with_counts 
            if loc[0] and loc[0].strip() and loc[1] > 0
        ]
        
        filtered_companies = [
            {'company': comp[0], 'count': comp[1]} 
            for comp in all_companies_with_counts 
            if comp[0] and comp[0].strip() and comp[1] > 0
        ]
        
        filtered_job_types = [
            {'type': jt[0], 'count': jt[1]} 
            for jt in job_types 
            if jt[0] and jt[0].strip() and jt[1] > 0
        ]
        
        # CREATE TOP LISTS FOR DISPLAY
        top_locations = filtered_locations[:10]
        top_companies = filtered_companies[:10]
        
        # CALCULATE TOTALS
        total_companies = len(filtered_companies)
        total_locations = len(filtered_locations)
        
        return jsonify({
            'total_jobs': total_jobs,
            'total_companies': total_companies,
            'total_locations': total_locations,
            'all_companies_with_counts': filtered_companies,
            'all_locations_with_counts': filtered_locations,
            'job_types': filtered_job_types,
            'top_locations': top_locations,
            'top_companies': top_companies,
            'all_companies': [comp['company'] for comp in filtered_companies],
            'all_locations': [loc['location'] for loc in filtered_locations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch stats: {str(e)}'}), 500