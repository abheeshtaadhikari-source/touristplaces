import React from 'react';
import { Link } from 'react-router-dom';

const PlaceCard = ({ place, isAdminMode, onEdit, onDelete, currentPage }) => {
  const { name, state, rating, bestTime, image } = place;

  const origin = isAdminMode ? '/admin' : '/';

  return (
    <Link 
      to={`/places/${place._id || place.id}`} 
      state={{ from: origin, page: currentPage }}
      className="place-card" 
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="place-card-image-wrapper">
        {image ? (
          <img src={image} alt={name} className="place-card-image" />
        ) : (
          <div className="place-card-image-placeholder">
            <svg className="placeholder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span className="placeholder-text">No Image Preview</span>
          </div>
        )}
        <div className="place-card-badge">
          <span className="state-badge">{state}</span>
        </div>
      </div>
      
      <div className="place-card-content">
        <div className="place-card-header">
          <h3 className="place-card-title">{name}</h3>
          <div className="place-card-rating">
            <svg className="rating-star-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span className="rating-value">{rating.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="place-card-details">
          <div className="detail-item">
            <svg className="detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <div className="detail-info">
              <span className="detail-label">Best Time to Visit</span>
              <span className="detail-value">{bestTime}</span>
            </div>
          </div>
        </div>

        {isAdminMode && (
          <div className="place-card-actions">
            <button 
              className="action-btn edit-btn" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onEdit) onEdit();
              }}
            >
              <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Edit
            </button>
            <button 
              className="action-btn delete-btn" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onDelete) onDelete();
              }}
            >
              <svg className="action-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </Link>
  );
};

export default PlaceCard;
