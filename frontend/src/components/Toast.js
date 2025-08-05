// frontend/src/components/Toast.js
import React, { useEffect } from 'react';

// TOAST NOTIFICATION COMPONENT FOR USER FEEDBACK
const Toast = ({ show, message, type = 'success', onClose, duration = 4000 }) => {
  // AUTO-CLOSE TOAST AFTER DURATION
  useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  if (!show) return null;

  // GET ICON BASED ON TOAST TYPE
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '✅';
    }
  };

  return (
    <div className={`toast toast-${type} ${show ? 'toast-show' : ''}`}>
      {/* TOAST CONTENT WITH ICON AND MESSAGE */}
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <span className="toast-message">{message}</span>
        {onClose && (
          <button 
            className="toast-close" 
            onClick={onClose}
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;