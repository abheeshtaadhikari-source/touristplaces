import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './CreateTrip.css';

const CreateTrip = () => {
  const { token, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tripTitle, setTripTitle] = useState('');
  const [places, setPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Fetch all places to search through
    fetch('/api/places', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.error('Failed to fetch places', err));
  }, [token, loading, navigate]);

  const filteredPlaces = useMemo(() => {
    if (!searchQuery) return [];
    return places
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8);
  }, [places, searchQuery]);

  const handleCreate = async () => {
    if (!tripTitle || selectedPlaces.length === 0 || !startDate || !endDate) {
      alert('Please fill out all fields and add at least one destination.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tripData = {
        title: tripTitle,
        startDate,
        endDate,
        places: selectedPlaces.map(p => p._id || p.id)
      };

      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tripData)
      });

      if (res.ok) {
        navigate('/trips');
      } else {
        const errorData = await res.json();
        alert(`Failed to create trip: ${errorData.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <main className="create-trip-page">
      <div className="create-trip-container">
        <div className="create-trip-header">
          <h1>Plan Your Next Trip</h1>
          <p>Search for a destination and pick your dates to get started.</p>
        </div>

        <div className="create-trip-form-container">
          <div className="form-group trip-name-group">
            <label>Trip Name</label>
            <input 
              type="text" 
              className="create-trip-input"
              placeholder="e.g. Summer Vacation 2026"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              required
            />
          </div>

          <div className="create-trip-search-box">
            <label>Add Destinations</label>
            <input 
              type="text" 
              className="create-trip-search-input"
              placeholder="Search and add a place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {searchQuery && filteredPlaces.length > 0 && (
              <ul className="create-trip-search-results">
                {filteredPlaces.map(place => (
                  <li 
                    key={place._id || place.id}
                    onClick={() => {
                      if (!selectedPlaces.find(p => (p._id || p.id) === (place._id || place.id))) {
                        setSelectedPlaces([...selectedPlaces, place]);
                      }
                      setSearchQuery('');
                    }}
                  >
                    {place.name}, {place.state}
                  </li>
                ))}
              </ul>
            )}
            
            {searchQuery && filteredPlaces.length === 0 && (
              <ul className="create-trip-search-results">
                <li className="no-results-li" style={{ cursor: 'default' }}>No destinations found</li>
              </ul>
            )}
          </div>

          {selectedPlaces.length > 0 && (
            <div className="selected-places-list">
              <label>Selected Destinations:</label>
              <div className="selected-places-badges">
                {selectedPlaces.map(place => (
                  <span key={place._id || place.id} className="selected-place-badge">
                    {place.name}
                    <button 
                      onClick={() => setSelectedPlaces(selectedPlaces.filter(p => (p._id || p.id) !== (place._id || place.id)))} 
                      title="Remove Destination"
                    >×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="create-trip-dates">
            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                className="create-trip-input"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input 
                type="date" 
                className="create-trip-input"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <button 
            className="create-trip-submit-btn" 
            onClick={handleCreate}
            disabled={isSubmitting || !tripTitle || selectedPlaces.length === 0 || !startDate || !endDate}
          >
            {isSubmitting ? 'Creating Itinerary...' : 'Create Trip'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default CreateTrip;