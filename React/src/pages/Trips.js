import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Trips.css';

const Trips = () => {
  const navigate = useNavigate();
  const { token, loading: authLoading } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({ title: '', startDate: '', endDate: '' });
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTripId, setEditTripId] = useState(null);
  const [editTripData, setEditTripData] = useState({ title: '', startDate: '', endDate: '' });

  const fetchTrips = useCallback(async () => {
    try {
      const res = await fetch('/api/itineraries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data.filter(trip => !trip.visited));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate('/login');
      return;
    }
    fetchTrips();
  }, [token, authLoading, navigate, fetchTrips]);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTrip)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewTrip({ title: '', startDate: '', endDate: '' });
        fetchTrips();
      } else {
        alert('Failed to create trip');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTrip = (e, trip) => {
    e.stopPropagation();
    setEditTripId(trip._id);
    setEditTripData({
      title: trip.title,
      startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
      endDate: trip.endDate ? trip.endDate.split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const submitEditTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/itineraries/${editTripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editTripData)
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setEditTripId(null);
        setEditTripData({ title: '', startDate: '', endDate: '' });
        fetchTrips();
      } else {
        alert('Failed to update trip');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkVisited = async (e, tripId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/itineraries/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ visited: true })
      });

      if (res.ok) {
        fetchTrips();
      } else {
        alert('Failed to mark trip as visited');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrip = async (e, tripId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        const res = await fetch(`/api/itineraries/${tripId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          fetchTrips();
        } else {
          alert('Failed to delete trip');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="trips-page">
        <div className="status-container">
          <div className="spinner"></div>
          <p>Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="trips-page">
      <div className="trips-container">
        <header className="trips-header">
          <div>
            <h1 className="page-title">Personal Trip Planner</h1>
            <p className="page-subtitle">Create, organize and manage your travel itineraries in one place.</p>
          </div>
          <button className="create-trip-btn-main" onClick={() => setIsModalOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New Trip
          </button>
        </header>

        {trips.length === 0 ? (
          <div className="empty-trips-text" style={{ color: '#e2e8f0', textAlign: 'center', padding: '3rem' }}>
            <h2>No trips planned yet</h2>
          </div>
        ) : (
          <div className="trips-grid">
            {trips.map(trip => (
              <div key={trip._id} className="trip-summary-card" onClick={() => navigate(`/trips/${trip._id}`)}>
                <div className="trip-card-header">
                  <span className="trip-plane-icon">✈️</span>
                  <h3 className="trip-card-title">{trip.title}</h3>
                </div>
                
                <div className="trip-card-dates">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>
                    {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <div className="trip-places-preview">
                  <span className="places-count-label">
                    {(trip.places || []).length} {(trip.places || []).length === 1 ? 'place' : 'places'} added
                  </span>
                  {trip.places && trip.places.length > 0 && (
                    <div className="preview-thumbnails">
                      {trip.places.slice(0, 3).map((place, idx) => (
                        <div key={place._id || idx} className="preview-thumb">
                          {place.image ? (
                            <img src={place.image} alt={place.name} />
                          ) : (
                            <div className="preview-thumb-placeholder">📍</div>
                          )}
                        </div>
                      ))}
                      {trip.places.length > 3 && (
                        <div className="preview-more">+{trip.places.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="trip-card-footer">
                  <span className="view-details-text">View Itinerary &rarr;</span>
                  <div className="trip-card-actions">
                    <button 
                      className="trip-card-visited-btn" 
                      onClick={(e) => handleMarkVisited(e, trip._id)}
                      title="Mark as Visited"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                    <button 
                      className="trip-card-edit-btn" 
                      onClick={(e) => handleEditTrip(e, trip)}
                      title="Edit Trip"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      className="trip-card-delete-btn" 
                      onClick={(e) => handleDeleteTrip(e, trip._id)}
                      title="Delete Trip"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Trip</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="create-trip-form">
              <div className="form-group">
                <label>Trip Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Goa Getaway, Shimla Summer"
                  value={newTrip.title}
                  onChange={e => setNewTrip({...newTrip, title: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={newTrip.startDate}
                    onChange={e => setNewTrip({...newTrip, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    required
                    value={newTrip.endDate}
                    onChange={e => setNewTrip({...newTrip, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Create Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Trip Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Trip</h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <form onSubmit={submitEditTrip} className="create-trip-form">
              <div className="form-group">
                <label>Trip Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Goa Getaway, Shimla Summer"
                  value={editTripData.title}
                  onChange={e => setEditTripData({...editTripData, title: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    required
                    value={editTripData.startDate}
                    onChange={e => setEditTripData({...editTripData, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    required
                    value={editTripData.endDate}
                    onChange={e => setEditTripData({...editTripData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Trips;
