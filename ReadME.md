# Job Listings Portal

Complete job listings application with React frontend, Flask API, and web scraper.

## Backend API

Flask REST API for job listings with filtering, pagination, and CRUD operations.

## Setup

```bash
# DIRECTORY
cd backend

# Install dependencies
pip install -r requirements.txt

# Create environment file
echo "DATABASE_URL=sqlite:///jobs.db" >> .env

# Run server
python app.py
```

Server runs at `http://localhost:5000`

## API Endpoints

```bash
# Health check
GET /api/health

# Jobs CRUD
GET /api/jobs                    # List jobs (with filters)
GET /api/jobs/<id>              # Get single job
POST /api/jobs                  # Create job
PUT /api/jobs/<id>              # Update job
DELETE /api/jobs/<id>           # Delete job

# Filters & Stats
GET /api/jobs/filter-options    # Dynamic filter options
GET /api/jobs/stats             # Job statistics
```

## Query Parameters

```bash
# Filtering
?search=python&location=new%20york&company=google&job_type=Full-time&tags=python,sql

# Date filtering
?date_filter=last_7_days
?date_filter=custom&date_from=2024-01-01&date_to=2024-01-31

# Sorting
?sort=posting_date_desc

# Pagination
?page=1&per_page=12
```

## Requirements

```
Flask==2.3.3
Flask-SQLAlchemy==3.0.5
Flask-CORS==4.0.0
python-dotenv==1.0.0
```

## Frontend

React application with job listings, filtering, and management interface.

### Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm start
```

Server runs at `http://localhost:3000`

### Features
- Job listings with pagination
- Advanced filtering and search
- Add/edit/delete jobs
- Responsive design
- Real-time filter updates

### Dependencies
```
React 18+
Axios for API calls
CSS modules for styling
```

## Scraper

Python web scraper for ActuaryList job data with pagination support.

### Setup

```bash
# Navigate to scraper directory
cd scraper

# Install dependencies
pip install selenium requests

# Install ChromeDriver
# Ubuntu: sudo apt-get install chromium-chromedriver
# macOS: brew install chromedriver
# Windows: Download from Chrome website

# Run scraper
python scraper.py
```

### Usage

```bash
# Interactive mode
python scraper.py

# Options:
# - Target jobs: 200 (default)
# - Max pages: 10 (default)
```

### Features
- Pagination support
- Duplicate prevention
- Rate limiting
- Error handling
- Progress tracking

### Dependencies
```
selenium==4.15.0
requests==2.31.0
chromedriver (system install)
```