// frontend/src/components/FilterSortJob.js
import React, { useState, useEffect, useCallback } from 'react';

// MAIN FILTER AND SORT COMPONENT FOR JOB LISTINGS
const FilterSortJob = ({ 
  filters, 
  onFilterChange, 
  jobTypes, 
  companies, 
  locations, 
  topLocations, 
  topCompanies,
  isDynamic = false
}) => {
  // STATE MANAGEMENT
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // SORT OPTIONS CONFIGURATION
  const sortOptions = [
    { value: 'posting_date_desc', label: 'Newest First' },
    { value: 'posting_date_asc', label: 'Oldest First' },
    { value: 'title_asc', label: 'Title A-Z' },
    { value: 'title_desc', label: 'Title Z-A' },
    { value: 'company_asc', label: 'Company A-Z' },
    { value: 'company_desc', label: 'Company Z-A' }
  ];

  // UPDATE LOCAL FILTERS WHEN PROPS CHANGE
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // DEBOUNCED SEARCH HANDLER
  const debouncedSearchChange = useCallback((searchValue) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      onFilterChange({ search: searchValue });
    }, 300);
    
    setSearchTimeout(timeout);
  }, [onFilterChange, searchTimeout]);

  // HANDLE INPUT CHANGES FOR ALL FILTER FIELDS
  const handleInputChange = (name, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'search') {
      debouncedSearchChange(value);
    } else {
      onFilterChange({ [name]: value });
    }
  };

  // CLEAR ALL FILTERS FUNCTION
  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      job_type: '',
      location: '',
      company: '',
      tags: '',
      sort: 'posting_date_desc',
      date_filter: '',
      date_from: '',
      date_to: ''
    };
    
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // CHECK IF ANY FILTERS ARE ACTIVE
  const hasActiveFilters = () => {
    return localFilters.search || 
           localFilters.job_type || 
           localFilters.location || 
           localFilters.company ||
           localFilters.tags ||
           localFilters.sort !== 'posting_date_desc' ||
           localFilters.date_filter ||
           localFilters.date_from ||
           localFilters.date_to;
  };

  // COUNT ACTIVE FILTERS
  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.search) count++;
    if (localFilters.job_type) count++;
    if (localFilters.location) count++;
    if (localFilters.company) count++;
    if (localFilters.tags) count++;
    if (localFilters.sort !== 'posting_date_desc') count++;
    if (localFilters.date_filter) count++;
    if (localFilters.date_from && localFilters.date_to && !localFilters.date_filter) count++;
    return count;
  };

  // PREPARE COMPANIES DATA FOR DROPDOWN
  const getCompaniesOptions = () => {
    // USE DYNAMIC DATA WHEN AVAILABLE
    if (isDynamic && companies && Array.isArray(companies)) {
      return companies.filter(comp => comp.count > 0);
    }
    
    // FALLBACK TO STATIC DATA PROCESSING
    if (companies && Array.isArray(companies) && companies.length > 0) {
      if (typeof companies[0] === 'object' && companies[0].company && companies[0].count !== undefined) {
        return companies.filter(comp => comp.count > 0);
      }
      if (typeof companies[0] === 'string') {
        return companies.slice(0, 100).map(company => ({ company, count: null }));
      }
      if (typeof companies[0] === 'object' && companies[0].company) {
        return companies.slice(0, 100);
      }
    }
    
    // FINAL FALLBACK TO TOP COMPANIES
    if (topCompanies && Array.isArray(topCompanies) && topCompanies.length > 0) {
      if (typeof topCompanies[0] === 'object' && topCompanies[0].company) {
        return topCompanies.filter(comp => !comp.count || comp.count > 0);
      }
      if (typeof topCompanies[0] === 'string') {
        return topCompanies.slice(0, 50).map(company => ({ company, count: null }));
      }
    }
    
    return [];
  };

  // PREPARE LOCATIONS DATA FOR DROPDOWN
  const getLocationsOptions = () => {
    // USE DYNAMIC DATA WHEN AVAILABLE
    if (isDynamic && locations && Array.isArray(locations)) {
      return locations.filter(loc => loc.count > 0);
    }
    
    // FALLBACK TO STATIC DATA PROCESSING
    if (locations && Array.isArray(locations) && locations.length > 0) {
      if (typeof locations[0] === 'object' && locations[0].location && locations[0].count !== undefined) {
        return locations.filter(loc => loc.count > 0);
      }
      if (typeof locations[0] === 'string') {
        return locations.slice(0, 100).map(location => ({ location, count: null }));
      }
      if (typeof locations[0] === 'object' && locations[0].location) {
        return locations.slice(0, 100);
      }
    }
    
    // FINAL FALLBACK TO TOP LOCATIONS
    if (topLocations && Array.isArray(topLocations) && topLocations.length > 0) {
      if (typeof topLocations[0] === 'object' && topLocations[0].location) {
        return topLocations.filter(loc => !loc.count || loc.count > 0);
      }
      if (typeof topLocations[0] === 'string') {
        return topLocations.slice(0, 50).map(location => ({ location, count: null }));
      }
    }
    
    return [];
  };

  const companiesOptions = getCompaniesOptions();
  const locationsOptions = getLocationsOptions();

  return (
    <div className="filter-sort-container">
      {/* FILTER HEADER WITH TITLE AND ACTIONS */}
      <div className="filter-header">
        <div className="filter-title">
          <h3>🔍 Search & Filter</h3>
          {hasActiveFilters() && (
            <span className="active-filters-badge">
              {getActiveFilterCount()} active
            </span>
          )}
        </div>
        
        <div className="filter-actions">
          {hasActiveFilters() && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="btn btn-clear"
            >
              Clear All
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-toggle"
          >
            {isExpanded ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>
      </div>

      {/* ALWAYS VISIBLE FILTERS - SEARCH AND SORT */}
      <div className="filter-main">
        <div className="filter-group">
          <input
            type="text"
            placeholder="🔍 Search jobs, companies, descriptions..."
            value={localFilters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={localFilters.sort}
            onChange={(e) => handleInputChange('sort', e.target.value)}
            className="sort-select"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                📊 {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* EXPANDABLE FILTER SECTION */}
      {isExpanded && (
        <div className="filter-expanded">
          {/* FIRST ROW - JOB TYPE AND COMPANY */}
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="job_type_filter">Job Type</label>
              <select
                id="job_type_filter"
                value={localFilters.job_type}
                onChange={(e) => handleInputChange('job_type', e.target.value)}
              >
                <option value="">All Types</option>
                {jobTypes && jobTypes.filter(type => type.count > 0).map(type => (
                  <option key={type.type} value={type.type}>
                    {type.type} ({type.count})
                  </option>
                ))}
              </select>
              {(!jobTypes || jobTypes.filter(type => type.count > 0).length === 0) && (
                <small className="no-data-message">No job types data available</small>
              )}
            </div>

            <div className="filter-group">
              <label htmlFor="company_filter">Company</label>
              <select
                id="company_filter"
                value={localFilters.company || ''}
                onChange={(e) => handleInputChange('company', e.target.value)}
              >
                <option value="">All Companies</option>
                {companiesOptions.map((companyData, index) => (
                  <option key={index} value={companyData.company}>
                    {companyData.company}
                    {companyData.count && companyData.count > 0 ? ` (${companyData.count})` : ''}
                  </option>
                ))}
              </select>
              {companiesOptions.length === 0 && (
                <small className="no-data-message">No companies data available</small>
              )}
            </div>
          </div>

          {/* SECOND ROW - LOCATION AND DATE FILTER */}
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="location_filter">Location</label>
              <select
                id="location_filter"
                value={localFilters.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              >
                <option value="">All Locations</option>
                {locationsOptions.map((locationData, index) => (
                  <option key={index} value={locationData.location}>
                    {locationData.location}
                    {locationData.count && locationData.count > 0 ? ` (${locationData.count})` : ''}
                  </option>
                ))}
              </select>
              {locationsOptions.length === 0 && (
                <small className="no-data-message">No locations data available</small>
              )}
            </div>

            <div className="filter-group">
              <label htmlFor="date_filter">Date Filter</label>
              <select
                id="date_filter"
                value={localFilters.date_filter || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange('date_filter', value);
                  if (value !== 'custom') {
                    handleInputChange('date_from', '');
                    handleInputChange('date_to', '');
                  }
                }}
              >
                <option value="">All Dates</option>
                <option value="today">📅 Today</option>
                <option value="last_7_days">📅 Last 7 Days</option>
                <option value="last_month">📅 Last Month</option>
                <option value="custom">📅 Custom Date Range</option>
              </select>
              <small className="field-help">
                Filter jobs by posting date
              </small>
            </div>
          </div>

          {/* THIRD ROW - TAGS */}
          <div className="filter-row">
            <div className="filter-group full-width">
              <label htmlFor="tags_filter">Tags</label>
              <input
                type="text"
                id="tags_filter"
                placeholder="e.g., Python, Health, Pricing (comma-separated)"
                value={localFilters.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
              />
              <small className="field-help">
                Search for jobs with specific tags (separate multiple with commas)
              </small>
            </div>
          </div>

          {/* CUSTOM DATE RANGE INPUTS */}
          {localFilters.date_filter === 'custom' && (
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="date_from">From Date</label>
                <input
                  type="date"
                  id="date_from"
                  value={localFilters.date_from}
                  onChange={(e) => handleInputChange('date_from', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="date_to">To Date</label>
                <input
                  type="date"
                  id="date_to"
                  value={localFilters.date_to}
                  onChange={(e) => handleInputChange('date_to', e.target.value)}
                  min={localFilters.date_from}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          {/* POPULAR TAGS SECTION */}
          <div className="popular-tags">
            <label>Popular Tags:</label>
            <div className="tag-buttons">
              {['Life', 'Health', 'Python', 'Pricing', 'Remote', 'Entry-Level'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-button ${localFilters.tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => {
                    const currentTags = localFilters.tags ? localFilters.tags.split(',').map(t => t.trim()) : [];
                    let newTags;
                    
                    if (currentTags.includes(tag)) {
                      newTags = currentTags.filter(t => t !== tag);
                    } else {
                      newTags = [...currentTags, tag];
                    }
                    
                    handleInputChange('tags', newTags.join(', '));
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE FILTERS SUMMARY */}
      {hasActiveFilters() && (
        <div className="filter-summary">
          <div className="active-filters">
            {localFilters.search && (
              <span className="filter-chip">
                Search: "{localFilters.search}"
                <button onClick={() => handleInputChange('search', '')}>×</button>
              </span>
            )}
            {localFilters.job_type && (
              <span className="filter-chip">
                Type: {localFilters.job_type}
                <button onClick={() => handleInputChange('job_type', '')}>×</button>
              </span>
            )}
            {localFilters.location && (
              <span className="filter-chip">
                Location: {localFilters.location}
                <button onClick={() => handleInputChange('location', '')}>×</button>
              </span>
            )}
            {localFilters.company && (
              <span className="filter-chip">
                Company: {localFilters.company}
                <button onClick={() => handleInputChange('company', '')}>×</button>
              </span>
            )}
            {localFilters.tags && (
              <span className="filter-chip">
                Tags: {localFilters.tags}
                <button onClick={() => handleInputChange('tags', '')}>×</button>
              </span>
            )}
            {localFilters.date_filter && (
              <span className="filter-chip">
                Date: {localFilters.date_filter === 'today' ? 'Today' : 
                       localFilters.date_filter === 'last_7_days' ? 'Last 7 Days' :
                       localFilters.date_filter === 'last_month' ? 'Last Month' : 
                       'Custom Range'}
                <button onClick={() => {
                  handleInputChange('date_filter', '');
                  handleInputChange('date_from', '');
                  handleInputChange('date_to', '');
                }}>×</button>
              </span>
            )}
            {localFilters.date_from && localFilters.date_to && !localFilters.date_filter && (
              <span className="filter-chip">
                Date: {localFilters.date_from} to {localFilters.date_to}
                <button onClick={() => {
                  handleInputChange('date_from', '');
                  handleInputChange('date_to', '');
                }}>×</button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSortJob;