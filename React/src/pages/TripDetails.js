import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './TripDetails.css';

const TripDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useContext(AuthContext);
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [allPlaces, setAllPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const handleBookNow = () => {
    if (!trip || !trip.places || trip.places.length === 0) {
      alert("No destinations added to this trip yet!");
      return;
    }
    
    if (trip.places.length === 1) {
      const place = trip.places[0];
      const query = encodeURIComponent(`makemytrip hotels flights in ${place.name} ${place.state || ''}`);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    } else {
      setIsBookModalOpen(true);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    fetch(`/api/itineraries/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Trip not found');
          throw new Error('Failed to fetch trip details');
        }
        return res.json();
      })
      .then(data => {
        setTrip(data);
        setEditTitle(data.title);
        // Format dates for input type="date"
        setEditStartDate(new Date(data.startDate).toISOString().split('T')[0]);
        setEditEndDate(new Date(data.endDate).toISOString().split('T')[0]);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
      
    // Fetch all places for autocomplete in edit mode
    fetch('/api/places', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAllPlaces(data))
      .catch(err => console.error('Failed to fetch places', err));
  }, [id, token, authLoading, navigate]);

  const filteredPlaces = useMemo(() => {
    if (!searchQuery) return [];
    return allPlaces
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8);
  }, [allPlaces, searchQuery]);

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/itineraries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editTitle,
          startDate: editStartDate,
          endDate: editEndDate
        })
      });

      if (res.ok) {
        const updatedTrip = await res.json();
        setTrip(updatedTrip);
        setIsEditing(false);
      } else {
        alert('Failed to update trip');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating trip');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPlace = async (placeId) => {
    try {
      const updatedPlaces = [...(trip.places || []).map(p => p._id || p), placeId];
      
      const res = await fetch(`/api/itineraries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ places: updatedPlaces })
      });

      if (res.ok) {
        const updatedTrip = await res.json();
        setTrip(updatedTrip);
        setSearchQuery('');
      } else {
        alert('Failed to add place');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding place');
    }
  };

  const handleRemovePlace = async (placeId) => {
    if (!window.confirm('Remove this place from your trip?')) return;

    try {
      const updatedPlaces = (trip.places || []).filter(p => (p._id || p) !== placeId).map(p => p._id || p);
      
      const res = await fetch(`/api/itineraries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ places: updatedPlaces })
      });

      if (res.ok) {
        const updatedTrip = await res.json();
        setTrip(updatedTrip);
      } else {
        alert('Failed to remove place');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing place');
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm('Are you sure you want to delete this entire trip?')) return;

    try {
      const res = await fetch(`/api/itineraries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        alert('Trip deleted');
        navigate('/trips');
      } else {
        alert('Failed to delete trip');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting trip');
    }
  };

  if (loading) {
    return (
      <div className="trip-details-page">
        <div className="status-container">
          <div className="spinner"></div>
          <p>Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="trip-details-page">
        <div className="status-container error">
          <h2>Error</h2>
          <p>{error || 'Trip not found'}</p>
          <Link to="/" className="back-link-btn">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="trip-details-page">
      <div className="trip-details-container">
        <header className="trip-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back
          </button>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {!isEditing && trip && trip.places && trip.places.length > 0 && (
              <button className="header-book-btn" onClick={handleBookNow}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Book Now
              </button>
            )}
            
            {!isEditing && (
              <button className="header-edit-btn" onClick={() => setIsEditing(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                Edit Trip
              </button>
            )}
            
            <button className="header-delete-btn" onClick={handleDeleteTrip}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete Trip
            </button>
          </div>
        </header>

        {isEditing ? (
          <section className="edit-mode-section">
            <div className="edit-mode-form-group">
              <label>Trip Name</label>
              <input 
                type="text" 
                className="edit-mode-input" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="edit-dates-row">
              <div className="edit-mode-form-group">
                <label>Start Date</label>
                <input 
                  type="date" 
                  className="edit-mode-input" 
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>
              <div className="edit-mode-form-group">
                <label>End Date</label>
                <input 
                  type="date" 
                  className="edit-mode-input" 
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <div className="add-place-search-container">
              <label style={{ color: '#64748b', display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Add More Destinations</label>
              <input 
                type="text" 
                className="edit-mode-input"
                placeholder="Search and add a place..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && filteredPlaces.length > 0 && (
                <ul className="add-place-search-results">
                  {filteredPlaces.map(place => (
                    <li 
                      key={place._id || place.id}
                      onClick={() => handleAddPlace(place._id || place.id)}
                    >
                      {place.name}, {place.state}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="edit-actions">
              <button className="cancel-edit-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="save-trip-btn" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>
        ) : (
          <section className="trip-info-card">
            <h1 className="trip-title">{trip.title}</h1>
            <div className="trip-dates">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{new Date(trip.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="date-separator">to</span>
              <span>{new Date(trip.endDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </section>
        )}

        <section className="trip-places-section">
          <h2 className="section-title">Places to Visit ({(trip.places || []).length})</h2>
          
          {!(trip.places && trip.places.length > 0) ? (
            <div className="empty-places-state">
              <p>You haven't added any places to this trip yet.</p>
              <Link to="/" className="explore-btn">Explore Destinations</Link>
            </div>
          ) : (
            <div className="trip-places-grid">
              {(trip.places || []).map(place => (
                <div key={place._id} className="trip-place-card">
                  <div className="trip-place-img-wrapper" onClick={() => navigate(`/places/${place._id}`)}>
                    {place.image ? (
                      <img src={place.image} alt={place.name} className="trip-place-img" />
                    ) : (
                      <div className="trip-place-img-placeholder">No Image</div>
                    )}
                    <span className="trip-place-state">{place.state}</span>
                  </div>
                  
                  <div className="trip-place-content">
                    <h3 className="trip-place-name" onClick={() => navigate(`/places/${place._id}`)}>
                      {place.name}
                    </h3>
                    {place.city && <p className="trip-place-city">{place.city}</p>}
                    
                    <button 
                      className="remove-place-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePlace(place._id);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {isBookModalOpen && trip && (
        <div className="modal-overlay" onClick={() => setIsBookModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book with MakeMyTrip</h3>
              <button className="close-btn" onClick={() => setIsBookModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Select a destination to search for flights and hotels on MakeMyTrip:</p>
            <div className="book-destinations-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {trip.places.map((place) => (
                <button
                  key={place._id || place.id}
                  className="book-dest-item-btn"
                  onClick={() => {
                    const query = encodeURIComponent(`makemytrip hotels flights in ${place.name} ${place.state || ''}`);
                    window.open(`https://www.google.com/search?q=${query}`, '_blank');
                    setIsBookModalOpen(false);
                  }}
                >
                  <span>{place.name}, {place.state}</span>
                  <span style={{ color: '#3b82f6', fontSize: '0.9rem' }}>Search &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default TripDetails;