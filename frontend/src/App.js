// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import { jobsAPI } from './api';
import JobList from './components/JobList';
import AddEditJob from './components/AddEditJob';
import FilterSortJob from './components/FilterSortJob';
import Toast from './components/Toast';
import Pagination from './components/Pagination';
import Swal from 'sweetalert2';

// MAIN APPLICATION COMPONENT
function App() {
  // CORE APPLICATION STATE
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  
  // FILTER STATE MANAGEMENT
  const [filters, setFilters] = useState({
    search: '',
    job_type: '',
    location: '',
    company: '',
    tags: '',
    sort: 'posting_date_desc',
    date_filter: '',
    date_from: '',
    date_to: ''
  });
  
  // STATISTICS AND DYNAMIC FILTER DATA
  const [stats, setStats] = useState(null);
  const [dynamicFilters, setDynamicFilters] = useState({
    job_types: [],
    companies: [],
    locations: []
  });
  
  // PAGINATION STATE
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0,
    totalPages: 0
  });

  // LOAD JOBS WHEN FILTERS OR PAGINATION CHANGE
  useEffect(() => {
    loadJobs();
    loadDynamicFilters();
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  // LOAD INITIAL STATISTICS
  useEffect(() => {
    loadStats();
  }, []);

  // MAIN JOBS LOADING FUNCTION
  const loadJobs = async () => {
    setLoading(true);
    setError('');
    
    try {
      // CREATE CLEAN PARAMS OBJECT
      const filterParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      
      const params = {
        ...filterParams,
        page: pagination.currentPage,
        page_size: pagination.itemsPerPage
      };
      
      const data = await jobsAPI.getJobs(params);
      
      setJobs(data.jobs || []);
      
      // UPDATE PAGINATION INFO FROM RESPONSE
      const totalItems = data.total_items || data.total || 0;
      const totalPages = data.total_pages || data.pages || Math.ceil(totalItems / pagination.itemsPerPage);
      const currentPage = data.current_page || data.page || pagination.currentPage;
      
      setPagination(prev => ({
        ...prev,
        totalItems: totalItems,
        totalPages: totalPages,
        currentPage: currentPage
      }));
      
    } catch (err) {
      setError(err.message);
      showToast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  // LOAD APPLICATION STATISTICS
  const loadStats = async () => {
    try {
      const data = await jobsAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  // LOAD DYNAMIC FILTER OPTIONS
  const loadDynamicFilters = async () => {
    try {
      const filterParams = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      
      const data = await jobsAPI.getFilterOptions(filterParams);
      setDynamicFilters(data);
    } catch (err) {
      console.error('Failed to load dynamic filter options:', err);
      setDynamicFilters({
        job_types: [],
        companies: [],
        locations: []
      });
    }
  };

  // SHOW TOAST NOTIFICATION
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // HANDLE NEW JOB CREATION
  const handleAddJob = async (jobData) => {
    try {
      await jobsAPI.createJob(jobData);
      
      // SWEETALERT2 SUCCESS MESSAGE
      await Swal.fire({
        title: 'Success!',
        text: 'Job created successfully!',
        icon: 'success',
        confirmButtonText: 'Great!',
        confirmButtonColor: '#4f46e5'
      });
      
      setShowAddForm(false);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      await loadJobs();
      await loadStats();
      await loadDynamicFilters();
    } catch (err) {
      await Swal.fire({
        title: 'Error!',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // HANDLE JOB UPDATE
  const handleUpdateJob = async (id, jobData) => {
    try {
      await jobsAPI.updateJob(id, jobData);
      
      // SWEETALERT2 SUCCESS MESSAGE
      await Swal.fire({
        title: 'Updated!',
        text: 'Job updated successfully!',
        icon: 'success',
        confirmButtonText: 'Perfect!',
        confirmButtonColor: '#4f46e5'
      });
      
      setEditingJob(null);
      await loadJobs();
      await loadDynamicFilters();
    } catch (err) {
      await Swal.fire({
        title: 'Error!',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // HANDLE JOB DELETION WITH SWEETALERT2
  const handleDeleteJob = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this action!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await jobsAPI.deleteJob(id);
      
      // SWEETALERT2 SUCCESS MESSAGE
      await Swal.fire({
        title: 'Deleted!',
        text: 'Job has been deleted successfully.',
        icon: 'success',
        confirmButtonText: 'Done',
        confirmButtonColor: '#4f46e5'
      });
      
      // ADJUST PAGINATION IF NEEDED
      const newTotal = pagination.totalItems - 1;
      const newTotalPages = Math.ceil(newTotal / pagination.itemsPerPage);
      if (pagination.currentPage > newTotalPages && newTotalPages > 0) {
        setPagination(prev => ({ ...prev, currentPage: newTotalPages }));
      } else {
        await loadJobs();
      }
      await loadStats();
      await loadDynamicFilters();
    } catch (err) {
      await Swal.fire({
        title: 'Error!',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  // HANDLE FILTER CHANGES
  const handleFilterChange = (newFilters) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters };
      return updated;
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // HANDLE PAGE NAVIGATION
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // HANDLE PAGE SIZE CHANGES
  const handlePageSizeChange = (pageSize) => {
    setPagination(prev => {
      const newPagination = {
        ...prev,
        itemsPerPage: pageSize,
        currentPage: 1
      };
      return newPagination;
    });
  };

  // HANDLE JOB EDITING WITH SCROLL TO TOP
  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowAddForm(false);
    
    // SCROLL TO TOP SMOOTHLY WHEN EDITING
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CANCEL EDIT MODE
  const handleCancelEdit = () => {
    setEditingJob(null);
  };

  // CANCEL ADD MODE
  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  // MANUAL DATA REFRESH WITH SWEETALERT2
  const handleManualRefresh = async () => {
    try {
      await loadJobs();
      await loadStats();
      await loadDynamicFilters();
      
      await Swal.fire({
        title: 'Refreshed!',
        text: 'Data refreshed successfully!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to refresh data.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  return (
    <div className="App">
      {/* APPLICATION HEADER */}
      <header className="app-header">
        <div className="container">
          <h1>🚀 BitBash Job Listings Portal</h1>
          <p>Find your next actuarial opportunity</p>
          
          {/* STATISTICS BAR */}
          {stats && (
            <div className="stats-bar">
              <span className="stat-item">
                📊 Total Jobs: <strong>{stats.total_jobs || 0}</strong>
              </span>
              <span className="stat-item">
                🏢 Companies: <strong>{stats.total_companies || stats.top_companies?.length || 0}</strong>
              </span>
              <span className="stat-item">
                📍 Locations: <strong>{stats.total_locations || stats.top_locations?.length || 0}</strong>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* MAIN APPLICATION CONTENT */}
      <main className="main-content">
        <div className="container">
          {/* ACTION BUTTONS */}
          <div className="action-bar">
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={editingJob !== null}
            >
              {showAddForm ? '❌ Cancel' : '➕ Add New Job'}
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={handleManualRefresh}
              disabled={loading}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {/* ADD/EDIT FORM SECTION */}
          {(showAddForm || editingJob) && (
            <div className="form-section">
              <AddEditJob
                job={editingJob}
                onSubmit={editingJob ? 
                  (data) => handleUpdateJob(editingJob.id, data) : 
                  handleAddJob
                }
                onCancel={editingJob ? handleCancelEdit : handleCancelAdd}
                isEditing={!!editingJob}
              />
            </div>
          )}

          {/* FILTERS AND SEARCH SECTION */}
          <div className="filter-section">
            <FilterSortJob
              filters={filters}
              onFilterChange={handleFilterChange}
              jobTypes={dynamicFilters?.job_types || stats?.job_types || []}
              companies={dynamicFilters?.companies || stats?.all_companies_with_counts || stats?.top_companies || []}
              locations={dynamicFilters?.locations || stats?.all_locations_with_counts || stats?.top_locations || []}
              topLocations={stats?.top_locations || []}
              topCompanies={stats?.top_companies || []}
              isDynamic={true}
            />
          </div>

          {/* ERROR MESSAGE DISPLAY */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* JOBS LIST SECTION */}
          <div className="jobs-section">
            <JobList
              jobs={jobs}
              loading={loading}
              onEdit={handleEditJob}
              onDelete={handleDeleteJob}
              pagination={pagination}
            />
          </div>

          {/* PAGINATION CONTROLS */}
          {!loading && jobs.length > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </main>

      {/* TOAST NOTIFICATIONS */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
}

export default App;