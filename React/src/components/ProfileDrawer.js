import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './ProfileDrawer.css';

const ProfileDrawer = ({ isOpen, onClose }) => {
  const { user, token, logout } = useContext(AuthContext);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isVisitedOpen, setIsVisitedOpen] = useState(false);
  const [visitedTrips, setVisitedTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || !token) return;

    fetch('/api/itineraries', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVisitedTrips(data.filter(trip => trip.visited));
        }
      })
      .catch(err => console.error(err));
  }, [isOpen, token]);

  const handleDeleteVisitedTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this visited trip?')) return;
    try {
      const res = await fetch(`/api/itineraries/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setVisitedTrips(visitedTrips.filter(t => t._id !== tripId));
      } else {
        alert('Failed to delete trip');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  const handlePlaceClick = (placeId) => {
    onClose();
    navigate(`/places/${placeId}`);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  return (
    <>
      {/* Backdrop overlay */}
      <div className={`drawer-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>

      {/* Slide-out Drawer container */}
      <div className={`profile-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <h2 className="drawer-title">Profile window</h2>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close Profile">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* User Info Details Panel */}
        <div className="drawer-user-info">
          <div className="user-avatar-large">
            {getInitials(user.name)}
          </div>
          <div className="user-text-details">
            <h3 className="user-name-title">{user.name}</h3>
            <p className="user-email-subtitle">{user.email}</p>
          </div>
        </div>

        {/* Action Collapsible Lists */}
        <div className="drawer-sections-wrapper">
          {/* My Wishlist Accordion */}
          <div className="accordion-section">
            <button 
              className={`accordion-header ${isWishlistOpen ? 'active' : ''}`}
              onClick={() => setIsWishlistOpen(!isWishlistOpen)}
            >
              <span className="header-text">My Wishlist</span>
              <svg className="chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {isWishlistOpen && (
              <div className="accordion-content">
                {user.wishlist && user.wishlist.length > 0 ? (
                  <div className="horizontal-scroll-track">
                    {user.wishlist.map((place) => (
                      <div 
                        key={place._id || place.id} 
                        className="scroll-card"
                        onClick={() => handlePlaceClick(place._id || place.id)}
                      >
                        {place.image ? (
                          <img src={place.image} alt={place.name} className="card-thumb-img" />
                        ) : (
                          <div className="card-thumb-placeholder">No Image</div>
                        )}
                        <span className="card-thumb-title">{place.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-section-message">No places in your wishlist yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Planned Trips Direct Link */}
          <div className="accordion-section">
            <button 
              className="accordion-header"
              onClick={() => {
                onClose();
                navigate('/trips');
              }}
            >
              <span className="header-text">Planned trips</span>
              <svg className="chevron-icon rotated" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(-90deg)' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>

          {/* Visited Trips Accordion */}
          <div className="accordion-section">
            <button 
              className={`accordion-header ${isVisitedOpen ? 'active' : ''}`}
              onClick={() => setIsVisitedOpen(!isVisitedOpen)}
            >
              <span className="header-text">Visited</span>
              <svg className="chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {isVisitedOpen && (
              <div className="accordion-content">
                {visitedTrips && visitedTrips.length > 0 ? (
                  <div className="drawer-visited-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
                    {visitedTrips.map((trip) => (
                      <div 
                        key={trip._id} 
                        className="drawer-visited-item"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          onClose();
                          navigate(`/trips/${trip._id}`);
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{trip.title}</span>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVisitedTrip(trip._id);
                          }}
                          title="Delete Visited Trip"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-section-message" style={{ margin: 0, padding: '0.5rem 0' }}>No visited trips yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Logout Button */}
        <div className="drawer-footer">
          <button 
            className="drawer-logout-btn" 
            onClick={() => {
              logout();
              onClose();
              navigate('/');
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default ProfileDrawer;
