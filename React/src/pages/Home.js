import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import PlaceCard from '../components/PlaceCard';
import { AuthContext } from '../context/AuthContext';

const Home = ({ onSelectPlace }) => {
  const [places, setPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [sortBy, setSortBy] = useState('');
  
  const location = useLocation();
  const initialPage = location.state?.page || 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const itemsPerPage = 24;
  
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isFirstRender = useRef(true);

  // Popular Carousel States
  const [popularIndex, setPopularIndex] = useState(0);

  // Compute top 10 popular destinations based on high ratings and cheap entry fee
  const popularPlaces = useMemo(() => {
    if (!places || places.length === 0) return [];
    return [...places]
      .map((place) => {
        const ratingScore = (place.rating || 0) * 20;
        const feeDeduction = (place.entryFee || 0) / 10;
        const finalScore = ratingScore - feeDeduction;
        return { ...place, score: finalScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [places]);

  // Compute wishlist places
  const wishlistPlaces = useMemo(() => {
    return places.filter((place) => place.isWishlisted);
  }, [places]);

  const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);
  useEffect(() => {
    try {
      const storageKey = user ? `recentlyViewed_${user._id || user.id}` : 'recentlyViewed';
      const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setRecentlyViewedIds(history);
    } catch (err) {
      console.error('Error reading recentlyViewed from localStorage:', err);
    }
  }, [user]);

  // Map the ID list to actual place objects in the exact order of recentlyViewedIds
  const recentlyViewedPlaces = useMemo(() => {
    if (!places || places.length === 0) return [];
    return recentlyViewedIds
      .map(id => places.find(p => (p._id || p.id) === id))
      .filter(Boolean);
  }, [places, recentlyViewedIds]);

  // Slideshow timer: advance slide every 5 seconds
  useEffect(() => {
    if (popularPlaces.length <= 1) return;
    const interval = setInterval(() => {
      setPopularIndex((prev) => (prev + 1) % popularPlaces.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [popularPlaces]);

  useEffect(() => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    fetch('/api/places', { headers })
      .then((res) => res.json())
      .then((data) => setPlaces(data))
      .catch((err) => console.error('Error fetching tourist places:', err));
  }, [token]);

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
    return Array.from(new Set(places.map((place) => place.state))).sort();
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

  const placeImages = useMemo(() => {
    return places
      .map((p) => p.image)
      .filter((img) => img && img !== 'https://.....' && img.startsWith('http'));
  }, [places]);

  const marqueeImages = useMemo(() => {
    if (placeImages.length === 0) return [];
    let list = [...placeImages];
    while (list.length < 15) {
      list = [...list, ...placeImages];
    }
    return list;
  }, [placeImages]);

  return (
    <>
      <main className="home-page">
      <div className="hero-section-wrapper">
        {/* Animated Floating Background Marquee */}
        <div className="animated-bg-container">
          <div className="animated-bg-overlay"></div>
          <div className="animated-bg-marquee">
            {/* Row 1 (Scroll Left) */}
            {marqueeImages.length > 0 && (
              <div className="marquee-row">
                <div className="marquee-track">
                  {marqueeImages.map((img, idx) => (
                    <div className="marquee-box" key={`r1-${idx}`}>
                      <img src={img} alt="Destination" />
                    </div>
                  ))}
                  {/* Duplicate track for seamless infinite marquee loop */}
                  {marqueeImages.map((img, idx) => (
                    <div className="marquee-box" key={`r1-dup-${idx}`}>
                      <img src={img} alt="Destination" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 2 (Scroll Right) */}
            {marqueeImages.length > 0 && (
              <div className="marquee-row reverse">
                <div className="marquee-track">
                  {marqueeImages.map((img, idx) => (
                    <div className="marquee-box" key={`r2-${idx}`}>
                      <img src={img} alt="Destination" />
                    </div>
                  ))}
                  {/* Duplicate track for seamless infinite marquee loop */}
                  {marqueeImages.map((img, idx) => (
                    <div className="marquee-box" key={`r2-dup-${idx}`}>
                      <img src={img} alt="Destination" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 3 (Scroll Left) */}
            {marqueeImages.length > 0 && (
              <div className="marquee-row">
                <div className="marquee-track">
                  {marqueeImages.map((img, idx) => (
                    <div className="marquee-box" key={`r3-${idx}`}>
                      <img src={img} alt="Destination" />
                    </div>
                  ))}
                  {/* Duplicate track for seamless infinite marquee loop */}
                  {marqueeImages.map((img, idx) => (
                    <div className="marquee-box" key={`r3-dup-${idx}`}>
                      <img src={img} alt="Destination" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Row 4 (Scroll Right) */}
            {marqueeImages.length > 0 && (
              <div className="marquee-row reverse">
                <div className="marquee-track">
                  {marqueeImages.map((img, idx) => (
                    <div className="marquee-box" key={`r4-${idx}`}>
                      <img src={img} alt="Destination" />
                    </div>
                  ))}
                  {/* Duplicate track for seamless infinite marquee loop */}
                  {marqueeImages.map((img, idx) => (
                    <div className="marquee-box" key={`r4-dup-${idx}`}>
                      <img src={img} alt="Destination" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'absolute', top: '20px', right: '40px', zIndex: 10 }}>
          {user && (
            <button 
              className="back-btn" 
              onClick={() => navigate('/create-trip')}
              title="Create a new trip"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px', width: '18px', height: '18px'}}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Trip
            </button>
          )}
        </div>

        <header className="home-hero">
          <div className="hero-content">
            <h1 className="hero-title">Find Your Next Adventure</h1>
            <p className="hero-subtitle">
              Explore the most beautiful and iconic tourist destinations across India.
            </p>
          </div>
        </header>

        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedState={selectedState}
          setSelectedState={setSelectedState}
          states={states}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      {/* Popular Destinations Section */}
      {!searchQuery && !selectedState && popularPlaces.length > 0 && (
        <section className="popular-section">
          <div className="places-container">
            <h2 className="popular-title">Popular Destinations</h2>
            
            <div className="popular-carousel-wrapper">
              <div 
                className="popular-carousel-track"
                style={{ transform: `translateX(-${popularIndex * 100}%)` }}
              >
                {popularPlaces.map((place) => (
                  <Link 
                    key={place._id || place.id} 
                    to={`/places/${place._id || place.id}`}
                    state={{ from: '/', page: currentPage }}
                    className="popular-carousel-item"
                  >
                    {place.image && place.image !== 'https://.....' ? (
                      <img src={place.image} alt={place.name} className="popular-carousel-img" />
                    ) : (
                      <div className="popular-carousel-img-placeholder">
                        <span>No Image Preview</span>
                      </div>
                    )}
                    <div className="popular-carousel-overlay">
                      <h3 className="popular-place-name">{place.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* Navigation dots indicator */}
              <div className="carousel-dots">
                {popularPlaces.map((_, idx) => (
                  <button
                    key={idx}
                    className={`carousel-dot ${popularIndex === idx ? 'active' : ''}`}
                    onClick={() => setPopularIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Wishlist Section */}
      {!searchQuery && !selectedState && wishlistPlaces.length > 0 && (
        <section className="wishlist-section">
          <div className="places-container">
            <div className="places-section-header">
              <h2 className="section-title">My Wishlist</h2>
              <span className="places-count">
                {wishlistPlaces.length} {wishlistPlaces.length === 1 ? 'place' : 'places'}
              </span>
            </div>
            <div className="places-grid">
              {wishlistPlaces.map((place) => (
                <div key={place._id || place.id} className="grid-item">
                  <PlaceCard
                    place={place}
                    currentPage={currentPage}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Viewed Section */}
      {!searchQuery && !selectedState && recentlyViewedPlaces.length > 0 && (
        <section className="recently-viewed-section">
          <div className="places-container">
            <div className="places-section-header">
              <h2 className="section-title">Recently Viewed</h2>
              <span className="places-count">
                {recentlyViewedPlaces.length} {recentlyViewedPlaces.length === 1 ? 'place' : 'places'}
              </span>
            </div>
            
            <div className="recently-viewed-scroll">
              {recentlyViewedPlaces.map((place) => (
                <div key={place._id || place.id} className="recently-viewed-card-wrapper">
                  <PlaceCard
                    place={place}
                    currentPage={currentPage}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="places-section">
        <div className="places-container">
          <div className="places-section-header">
            <h2 className="section-title">
              {selectedState ? `${selectedState} Destinations` : 'All Destinations'}
            </h2>
            <span className="places-count">
              {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'} found
            </span>
          </div>

          {filteredPlaces.length > 0 ? (
            <>
              <div className="places-grid">
                {paginatedPlaces.map((place) => (
                  <div key={place._id || place.id} className="grid-item">
                    <PlaceCard
                      place={place}
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
      </section>
    </main>
    </>
  );
};

export default Home;
