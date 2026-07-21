import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import PlaceCard from '../components/PlaceCard';
import SearchBar from '../components/SearchBar';

const Admin = ({ onAddPlace, onEditPlace, onSelectPlace }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [sortBy, setSortBy] = useState('');

  const location = useLocation();
  const initialPage = location.state?.page || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const itemsPerPage = 24;
  const isFirstRender = useRef(true);

  const fetchPlaces = () => {
    setLoading(true);
    fetch('/api/places')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch destinations.');
        }
        return res.json();
      })
      .then((data) => {
        setPlaces(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching places:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  // Reset page to 1 when filters or sorting change (skipped on initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, selectedState, sortBy]);

  // Sync page state with incoming router history state
  useEffect(() => {
    if (location.state?.page) {
      setCurrentPage(location.state.page);
    }
  }, [location.state]);

  // Extract unique states for the filter dropdown
  const states = useMemo(() => {
    return Array.from(new Set(places.map((place) => place.state))).filter(Boolean).sort();
  }, [places]);

  // Filter and sort places based on search query, selected state, and sorting selection
  const filteredPlaces = useMemo(() => {
    let result = places.filter((place) => {
      const matchesSearch = (place.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesState = selectedState === '' || place.state === selectedState;
      return matchesSearch && matchesState;
    });

    if (sortBy === 'budget-asc') {
      result.sort((a, b) => (a.entryFee ?? 0) - (b.entryFee ?? 0));
    } else if (sortBy === 'budget-desc') {
      result.sort((a, b) => (b.entryFee ?? 0) - (a.entryFee ?? 0));
    } else if (sortBy === 'rating-desc') {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sortBy === 'bestTime-asc') {
      result.sort((a, b) => (a.bestTime || '').localeCompare(b.bestTime || ''));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    }

    return result;
  }, [places, searchQuery, selectedState, sortBy]);

  // Sliced places for pagination
  const paginatedPlaces = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPlaces.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPlaces, currentPage]);

  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      fetch(`/api/places/${id}`, {
        method: 'DELETE',
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to delete destination.');
          }
          return res.json();
        })
        .then(() => {
          setPlaces((prevPlaces) => prevPlaces.filter((p) => p._id !== id));
        })
        .catch((err) => {
          console.error('Delete error:', err);
          alert(`Error: ${err.message}`);
        });
    }
  };

  if (loading) {
    return (
      <div className="admin-loader-container">
        <div className="loader"></div>
        <p className="loader-text">Loading administrator dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error-container">
        <div className="error-card">
          <h3>Failed to Load Admin Panel</h3>
          <p>{error}</p>
          <button className="back-btn" onClick={fetchPlaces}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header-row">
          <div className="admin-title-area">
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Manage, edit, or add new tourist destinations.</p>
          </div>
          <button className="add-place-btn" onClick={onAddPlace}>
            <svg className="add-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Place
          </button>
        </div>

        {places.length > 0 && (
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            states={states}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        )}

        {places.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No Destinations Exist</h3>
            <p>Your database is empty. Get started by adding a new tourist place.</p>
            <button className="add-place-btn" onClick={onAddPlace}>
              Add New Place
            </button>
          </div>
        ) : filteredPlaces.length > 0 ? (
          <>
            <div className="places-grid">
              {paginatedPlaces.map((place) => (
                <div key={place._id || place.id} className="grid-item">
                  <PlaceCard
                    place={place}
                    isAdminMode={true}
                    onEdit={() => onEditPlace(place._id || place.id)}
                    onDelete={() => handleDelete(place._id || place.id, place.name)}
                    currentPage={currentPage}
                  />
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <h3>No Destinations Found</h3>
            <p>We couldn't find any places matching "{searchQuery}" in {selectedState || 'any state'}. Try refining your search.</p>
            <button 
              className="reset-filters-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedState('');
                setSortBy('');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
