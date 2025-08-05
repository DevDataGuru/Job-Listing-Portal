// frontend/src/components/Pagination.js
import React from 'react';

// PAGINATION COMPONENT FOR NAVIGATING THROUGH PAGES
const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onPageSizeChange 
}) => {
  // CALCULATE RANGE OF ITEMS BEING SHOWN
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // PAGE SIZE OPTIONS CONFIGURATION
  const pageSizeOptions = [6, 12, 24, 48];

  // GENERATE PAGE NUMBERS WITH ELLIPSIS FOR LARGE RANGES
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((page, index, arr) => 
      arr.indexOf(page) === index
    );
  };

  // HANDLE PAGE NUMBER CLICK
  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // HANDLE PREVIOUS PAGE NAVIGATION
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // HANDLE NEXT PAGE NAVIGATION
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // HANDLE PAGE SIZE CHANGE
  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value);
    onPageSizeChange(newPageSize);
  };

  // SINGLE PAGE DISPLAY
  if (totalPages <= 1) {
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          <span>Showing {totalItems} {totalItems === 1 ? 'job' : 'jobs'}</span>
        </div>
        
        <div className="page-size-selector">
          <label htmlFor="pageSize">Jobs per page:</label>
          <select 
            id="pageSize"
            value={itemsPerPage} 
            onChange={handlePageSizeChange}
            className="page-size-select"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="pagination-container">
      {/* PAGINATION INFO DISPLAY */}
      <div className="pagination-info">
        <span>
          Showing {startItem}-{endItem} of {totalItems} jobs
        </span>
      </div>

      {/* PAGINATION NAVIGATION CONTROLS */}
      <div className="pagination-controls">
        {/* PREVIOUS BUTTON */}
        <button
          className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ← Previous
        </button>

        {/* PAGE NUMBERS */}
        <div className="pagination-numbers">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              className={`pagination-btn ${
                page === currentPage ? 'active' : ''
              } ${page === '...' ? 'dots' : ''}`}
              onClick={() => handlePageClick(page)}
              disabled={page === '...'}
            >
              {page}
            </button>
          ))}
        </div>

        {/* NEXT BUTTON */}
        <button
          className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>

      {/* PAGE SIZE SELECTOR */}
      <div className="page-size-selector">
        <label htmlFor="pageSize">Jobs per page:</label>
        <select 
          id="pageSize"
          value={itemsPerPage} 
          onChange={handlePageSizeChange}
          className="page-size-select"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;