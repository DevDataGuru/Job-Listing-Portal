// frontend/src/components/AddEditJob.js
import React, { useState, useEffect } from 'react';

// COMPONENT FOR ADDING AND EDITING JOB POSTINGS
const AddEditJob = ({ job, onSubmit, onCancel, isEditing = false }) => {
  // HELPER FUNCTION TO GET TODAY'S DATE IN YYYY-MM-DD FORMAT
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // FORM STATE MANAGEMENT
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    job_type: 'Full-time',
    tags: '',
    description: '',
    url: '',
    posting_date: getTodayDate()
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // JOB TYPE OPTIONS CONFIGURATION
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Temporary'
  ];

  // POPULATE FORM WHEN EDITING OR RESET FOR NEW JOB
  useEffect(() => {
    if (isEditing && job) {
      setFormData({
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        job_type: job.job_type || 'Full-time',
        tags: Array.isArray(job.tags) ? job.tags.join(', ') : (job.tags || ''),
        description: job.description || '',
        url: job.url || '',
        posting_date: job.posting_date ? 
          new Date(job.posting_date).toISOString().split('T')[0] : getTodayDate()
      });
    } else {
      setFormData(prev => ({
        ...prev,
        posting_date: getTodayDate()
      }));
    }
  }, [job, isEditing]);

  // FORM VALIDATION FUNCTION
  const validateForm = () => {
    const newErrors = {};

    // REQUIRED FIELDS VALIDATION
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    // URL VALIDATION
    if (formData.url && formData.url.trim()) {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    // TAGS VALIDATION
    if (formData.tags) {
      const tags = formData.tags.split(',').map(tag => tag.trim());
      if (tags.some(tag => tag.length > 50)) {
        newErrors.tags = 'Individual tags should be less than 50 characters';
      }
    }

    // DATE VALIDATION
    if (!formData.posting_date) {
      newErrors.posting_date = 'Posting date is required';
    } else {
      const selectedDate = new Date(formData.posting_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (selectedDate > today) {
        newErrors.posting_date = 'Posting date cannot be in the future';
      }
    }

    return newErrors;
  };

  // HANDLE INPUT CHANGES AND CLEAR ERRORS
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // HANDLE FORM SUBMISSION
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // PREPARE DATA FOR SUBMISSION
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        posting_date: formData.posting_date || getTodayDate()
      };

      await onSubmit(submitData);
      
      // RESET FORM FOR NEW JOB CREATION
      if (!isEditing) {
        setFormData({
          title: '',
          company: '',
          location: '',
          job_type: 'Full-time',
          tags: '',
          description: '',
          url: '',
          posting_date: getTodayDate()
        });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-edit-job">
      {/* FORM HEADER */}
      <div className="form-header">
        <h2>{isEditing ? '✏️ Edit Job' : '➕ Add New Job'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="job-form">
        {/* SUBMISSION ERROR MESSAGE */}
        {errors.submit && (
          <div className="error-message">
            ⚠️ {errors.submit}
          </div>
        )}

        {/* FIRST ROW - TITLE AND COMPANY */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
              placeholder="e.g., Senior Actuarial Analyst"
              maxLength="200"
            />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="company">Company *</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className={errors.company ? 'error' : ''}
              placeholder="e.g., ABC Insurance Co."
              maxLength="200"
            />
            {errors.company && <div className="field-error">{errors.company}</div>}
          </div>
        </div>

        {/* SECOND ROW - LOCATION AND JOB TYPE */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={errors.location ? 'error' : ''}
              placeholder="e.g., New York, NY or Remote"
              maxLength="200"
            />
            {errors.location && <div className="field-error">{errors.location}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="job_type">Job Type</label>
            <select
              id="job_type"
              name="job_type"
              value={formData.job_type}
              onChange={handleInputChange}
            >
              {jobTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* THIRD ROW - TAGS AND POSTING DATE */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className={errors.tags ? 'error' : ''}
              placeholder="e.g., Life, Health, Pricing, Python (comma-separated)"
            />
            {errors.tags && <div className="field-error">{errors.tags}</div>}
            <small className="field-help">Separate multiple tags with commas</small>
          </div>

          <div className="form-group">
            <label htmlFor="posting_date">Posting Date</label>
            <input
              type="date"
              id="posting_date"
              name="posting_date"
              value={formData.posting_date}
              onChange={handleInputChange}
              className={errors.posting_date ? 'error' : ''}
              max={getTodayDate()}
            />
            {errors.posting_date && <div className="field-error">{errors.posting_date}</div>}
            <small className="field-help">Defaults to today's date</small>
          </div>
        </div>

        {/* JOB URL FIELD */}
        <div className="form-group">
          <label htmlFor="url">Job URL</label>
          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            className={errors.url ? 'error' : ''}
            placeholder="https://example.com/job-posting"
          />
          {errors.url && <div className="field-error">{errors.url}</div>}
        </div>

        {/* JOB DESCRIPTION FIELD */}
        <div className="form-group">
          <label htmlFor="description">Job Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            placeholder="Brief description of the role, responsibilities, and requirements..."
            maxLength="2000"
          />
          <small className="field-help">
            {formData.description.length}/2000 characters
          </small>
        </div>

        {/* FORM ACTION BUTTONS */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 
              (isEditing ? 'Updating...' : 'Creating...') : 
              (isEditing ? 'Update Job' : 'Create Job')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditJob;