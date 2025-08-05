// frontend/src/components/JobList.js
import React from 'react';
import JobCard from './JobCard';

// JOB LIST CONTAINER COMPONENT FOR DISPLAYING MULTIPLE JOBS
const JobList = ({ jobs, loading, onEdit, onDelete, pagination }) => {
  // LOADING STATE DISPLAY
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading jobs...</p>
      </div>
    );
  }

  // EMPTY STATE DISPLAY
  if (!jobs || jobs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No jobs found</h3>
        <p>
          {pagination && pagination.totalItems === 0 
            ? "Try adjusting your filters or add some jobs to get started."
            : "No jobs match your current filters. Try adjusting your search criteria."
          }
        </p>
      </div>
    );
  }

  // GENERATE RESULTS TEXT WITH PAGINATION INFO
  const getResultsText = () => {
    if (!pagination) return `Available Positions (${jobs.length})`;
    
    const { currentPage, itemsPerPage, totalItems } = pagination;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    return `Available Positions (${startItem}-${endItem} of ${totalItems})`;
  };

  return (
    <div className="job-list">
      {/* JOB LIST HEADER WITH RESULTS COUNT */}
      <div className="job-list-header">
        <h2>{getResultsText()}</h2>
        {pagination && pagination.totalPages > 1 && (
          <div className="page-indicator">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
        )}
      </div>
      
      {/* JOB CARDS GRID */}
      <div className="job-grid">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default JobList;