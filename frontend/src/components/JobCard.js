// frontend/src/components/JobCard.js
import React from 'react';

// INDIVIDUAL JOB CARD COMPONENT FOR DISPLAYING JOB DETAILS
const JobCard = ({ job, onEdit, onDelete }) => {
  // FORMAT DATE TO HUMAN READABLE RELATIVE TIME
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1d ago';
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // GET CSS CLASS FOR JOB TYPE STYLING
  const getJobTypeColor = (jobType) => {
    const colors = {
      'Full-time': 'job-type-fulltime',
      'Part-time': 'job-type-parttime',
      'Contract': 'job-type-contract',
      'Internship': 'job-type-internship',
      'Temporary': 'job-type-temporary'
    };
    return colors[jobType] || 'job-type-default';
  };

  // RENDER JOB TAGS WITH LIMIT FOR COMPACT VIEW
  const renderTags = (tagsString) => {
    if (!tagsString) return null;
    
    const tags = Array.isArray(tagsString) ? tagsString : tagsString.split(',');
    return tags
      .filter(tag => tag && tag.trim())
      .slice(0, 3)
      .map((tag, index) => (
        <span key={index} className="job-tag">
          {tag.trim()}
        </span>
      ));
  };

  return (
    <div className="job-card">
      {/* JOB CARD HEADER WITH TITLE AND ACTIONS */}
      <div className="job-card-header">
        <h3 className="job-title">{job.title}</h3>
        <div className="job-actions">
          <button
            className="btn-icon btn-edit"
            onClick={() => onEdit(job)}
            title="Edit job"
          >
            ✏️
          </button>
          <button
            className="btn-icon btn-delete"
            onClick={() => onDelete(job.id)}
            title="Delete job"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* JOB CARD MAIN CONTENT */}
      <div className="job-card-body">
        {/* COMPANY INFORMATION */}
        <div className="job-company">
          <span className="icon">🏢</span>
          <strong>{job.company}</strong>
        </div>

        {/* LOCATION INFORMATION */}
        <div className="job-location">
          <span className="icon">📍</span>
          {job.location}
        </div>

        {/* JOB TYPE AND DATE METADATA */}
        <div className="job-meta">
          <span className={`job-type ${getJobTypeColor(job.job_type)}`}>
            {job.job_type}
          </span>
          <span className="job-date">
            <span className="icon">📅</span>
            {formatDate(job.posting_date)}
          </span>
        </div>

        {/* JOB TAGS SECTION */}
        {job.tags && (
          <div className="job-tags">
            {renderTags(job.tags)}
          </div>
        )}

        {/* EXTERNAL JOB LINK */}
        {job.url && (
          <div className="job-link">
            <a 
              href={job.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="external-link"
            >
              View Original 🔗
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCard;