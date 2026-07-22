import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

import carIcon from '../assets/car.png';
import bikeIcon from '../assets/bicycle.png';
import walkIcon from '../assets/walk.png';

// Custom colored markers to bypass Webpack default marker bundling issues
const getMarkerIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const startIcon = getMarkerIcon('green');
const destinationIcon = getMarkerIcon('blue');

// Helper component to bind Leaflet Routing Control inside React Leaflet
const RoutingMachine = ({ start, end, serviceUrl }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !start || !end) return;

    const routingControl = L.Routing.control({
      serviceUrl: serviceUrl, // Set the routing profile (car, bike, foot)
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      lineOptions: {
        styles: [{ color: '#2563eb', weight: 6, opacity: 0.85 }]
      },
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: true,
      createMarker: function () { return null; } // We use custom React Leaflet markers instead
    });

    // Safety patches: If the control is unmounted before the async OSRM API returns,
    // prevent callbacks from running and trying to access a null map reference.
    const originalClearLines = routingControl._clearLines;
    routingControl._clearLines = function () {
      if (this._map) {
        return originalClearLines.apply(this);
      }
    };

    const originalRouteDone = routingControl._routeDone;
    routingControl._routeDone = function (...args) {
      if (this._map) {
        return originalRouteDone.apply(this, args);
      }
    };

    const originalRouteError = routingControl._routeError;
    routingControl._routeError = function (...args) {
      if (this._map) {
        return originalRouteError.apply(this, args);
      }
    };

    routingControl.addTo(map);

    return () => {
      if (map && routingControl) {
        try {
          map.removeControl(routingControl);
        } catch (e) {
          console.warn('Safely caught Leaflet Routing Machine unmount cleanup error:', e);
        }
      }
    };
  }, [map, start, end, serviceUrl]);

  return null;
};

const MapClickHandler = ({ url }) => {
  useMapEvents({
    click: () => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  });
  return null;
};

const PlaceDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const backPath = location.state?.from || '/';
  
  const { user, token, refreshUser } = useContext(AuthContext);
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map States
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [startCoords, setStartCoords] = useState(null);
  const [startName, setStartName] = useState('');
  const [showRoute, setShowRoute] = useState(false);

  // Travel Mode States
  const [routeMetrics, setRouteMetrics] = useState({ car: null, bike: null, walk: null });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [transportMode, setTransportMode] = useState('car'); // Default to driving

  // Dropdown States
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [customInput, setCustomInput] = useState('');
  const [geocodingStart, setGeocodingStart] = useState(false);

  //Weather States
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Trip Builder States
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [userTrips, setUserTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [isCreatingNewTrip, setIsCreatingNewTrip] = useState(false);
  const [newTripData, setNewTripData] = useState({ title: '', startDate: '', endDate: '' });

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`/api/places/${id}/wishlist`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setPlace(prev => ({ ...prev, isWishlisted: data.isWishlisted }));
        refreshUser(); // sync context
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  const openTripModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsTripModalOpen(true);
    fetchUserTrips();
  };

  const fetchUserTrips = async () => {
    setLoadingTrips(true);
    try {
      const res = await fetch('/api/itineraries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserTrips(data);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleAddToExistingTrip = async (tripId) => {
    try {
      const trip = userTrips.find(t => t._id === tripId);
      const updatedPlaces = [...((trip.places || []).map(p => p._id || p)), id];
      
      const res = await fetch(`/api/itineraries/${tripId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ places: updatedPlaces })
      });
      
      if (res.ok) {
        alert('Added to trip successfully!');
        setIsTripModalOpen(false);
      } else {
        alert('Failed to add to trip.');
      }
    } catch (err) {
      console.error('Error adding to trip:', err);
    }
  };

  const handleCreateAndAddTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTripData,
          places: [id]
        })
      });
      
      if (res.ok) {
        alert('New trip created and place added!');
        setIsTripModalOpen(false);
        setIsCreatingNewTrip(false);
        setNewTripData({ title: '', startDate: '', endDate: '' });
      } else {
        const errorData = await res.json();
        alert(`Failed to create trip: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Error creating trip:', err);
    }
  };

  // Fetch Place Details
  useEffect(() => {
    setLoading(true);
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    fetch(`/api/places/${id}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load place details');
        return res.json();
      })
      .then((data) => {
        setPlace(data);
        setLoading(false);

        // Fetch Weather Data from our secure backend proxy
        setLoadingWeather(true);
        fetch(`/api/places/${id}/weather`)
          .then((res) => {
            if (!res.ok) throw new Error('Weather data unavailable');
            return res.json();
          })
          .then((weatherData) => {
            setWeather(weatherData);
            setLoadingWeather(false);
          })
          .catch((err) => {
            console.error('Weather fetch error:', err);
            setLoadingWeather(false);
          });

        // Cascading Geocoding helper to find coordinates using User Entered Location or Fallbacks
        const tryGeocode = (queries) => {
          if (queries.length === 0) {
            console.error('All geocoding attempts failed for this destination.');
            return;
          }

          const currentQuery = queries[0];
          if (!currentQuery || !currentQuery.trim()) {
            tryGeocode(queries.slice(1));
            return;
          }

          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentQuery)}`)
            .then((res) => res.json())
            .then((geoData) => {
              if (geoData && geoData.length > 0) {
                setDestinationCoords([parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)]);
              } else {
                tryGeocode(queries.slice(1));
              }
            })
            .catch((err) => {
              console.error(`Geocoding failed for query "${currentQuery}":`, err);
              tryGeocode(queries.slice(1));
            });
        };

        const searchQueries = [];
        searchQueries.push(`${data.name}, ${data.state}, India`);
        if (data.location) searchQueries.push(data.location);
        if (data.city) searchQueries.push(`${data.city}, ${data.state}, India`);
        searchQueries.push(`${data.state}, India`);

        tryGeocode(searchQueries);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Load search history from localStorage
    loadSearchHistory();
  }, [id, token]);

  // Save to Recently Viewed history in localStorage
  useEffect(() => {
    if (place) {
      try {
        const storageKey = user ? `recentlyViewed_${user._id || user.id}` : 'recentlyViewed';
        const history = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const placeId = place._id || place.id;
        const filteredHistory = history.filter(id => id !== placeId);
        filteredHistory.unshift(placeId);
        const updatedHistory = filteredHistory.slice(0, 10);
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      } catch (err) {
        console.error('Error writing to recentlyViewed localStorage:', err);
      }
    }
  }, [place, user]);

  const loadSearchHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('frequentStartLocations') || '{}');
      const sorted = Object.keys(history)
        .sort((a, b) => history[b] - history[a])
        .slice(0, 5); // Show top 5 entered locations
      setHistoryList(sorted);
    } catch (e) {
      console.error('Failed to load search history', e);
    }
  };

  const saveToHistory = (name) => {
    if (!name || name === 'Your Current Location') return;
    try {
      const history = JSON.parse(localStorage.getItem('frequentStartLocations') || '{}');
      history[name] = (history[name] || 0) + 1;
      localStorage.setItem('frequentStartLocations', JSON.stringify(history));
      loadSearchHistory();
    } catch (e) {
      console.error('Failed to save search history', e);
    }
  };

  // Handler to search custom user input
  const handleCustomSearch = (e) => {
    if (e) e.preventDefault();
    if (!customInput.trim()) return;

    setGeocodingStart(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customInput)}`)
      .then((res) => res.json())
      .then((data) => {
        setGeocodingStart(false);
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setStartCoords([lat, lon]);
          setStartName(customInput);
          setShowRoute(false); // Reset route until "Get Route" is clicked
          saveToHistory(customInput);
          setDropdownOpen(false);
          setCustomInput('');
        } else {
          alert('Could not find that starting location. Try a different city or region.');
        }
      })
      .catch((err) => {
        setGeocodingStart(false);
        console.error(err);
        alert('Error searching starting location.');
      });
  };

  // Handler to select from history options
  const handleHistorySelect = (name) => {
    setGeocodingStart(true);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}`)
      .then((res) => res.json())
      .then((data) => {
        setGeocodingStart(false);
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setStartCoords([lat, lon]);
          setStartName(name);
          setShowRoute(false); // Reset route until "Get Route" is clicked
          setDropdownOpen(false);
        }
      })
      .catch((err) => {
        setGeocodingStart(false);
        console.error(err);
        alert('Error loading starting coordinates.');
      });
  };

  // Handler to use browser GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStartCoords([position.coords.latitude, position.coords.longitude]);
        setStartName('Your Current Location');
        setShowRoute(false); // Reset route until "Get Route" is clicked
        setDropdownOpen(false);
      },
      (err) => {
        console.warn(err);
        alert('Could not retrieve your current location. Please type it manually.');
      }
    );
  };

  // Handler to calculate route metrics for all 3 modes
  const handleGetRoute = () => {
    if (!startCoords) {
      alert('Please select a starting location first!');
      return;
    }

    const coordsStr = `${startCoords[1]},${startCoords[0]};${destinationCoords[1]},${destinationCoords[0]}`;
    setLoadingMetrics(true);

    Promise.all([
      fetch(`https://routing.openstreetmap.de/routed-car/route/v1/driving/${coordsStr}?overview=false`).then((res) => res.json()),
      fetch(`https://routing.openstreetmap.de/routed-bike/route/v1/driving/${coordsStr}?overview=false`).then((res) => res.json()),
      fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordsStr}?overview=false`).then((res) => res.json())
    ])
      .then(([carData, bikeData, walkData]) => {
        setLoadingMetrics(false);

        const baseDistance = carData.code === 'Ok' && carData.routes[0] ? carData.routes[0].distance : 0;
        const baseDuration = carData.code === 'Ok' && carData.routes[0] ? carData.routes[0].duration : 0;

        const metrics = {
          car: baseDistance ? { distance: baseDistance, duration: baseDuration } : null,

          // OSRM bike server logic, fallback to car distance at 15 km/h
          bike: bikeData.code === 'Ok' && bikeData.routes[0]
            ? { distance: bikeData.routes[0].distance, duration: bikeData.routes[0].duration }
            : baseDistance ? { distance: baseDistance, duration: (baseDistance / 1000 / 15) * 3600 } : null,

          // OSRM foot server logic, fallback to car distance at 5 km/h
          walk: walkData.code === 'Ok' && walkData.routes[0]
            ? { distance: walkData.routes[0].distance, duration: walkData.routes[0].duration }
            : baseDistance ? { distance: baseDistance, duration: (baseDistance / 1000 / 5) * 3600 } : null
        };

        setRouteMetrics(metrics);
        setShowRoute(true);
      })
      .catch((err) => {
        setLoadingMetrics(false);
        console.error('Error fetching routing metrics:', err);
        alert('Could not retrieve detailed metrics for all modes. Showing default car route.');
        setShowRoute(true);
      });
  };

  const getServiceUrl = (mode) => {
    switch (mode) {
      case 'bike':
        return 'https://routing.openstreetmap.de/routed-bike/route/v1';
      case 'walk':
        return 'https://routing.openstreetmap.de/routed-foot/route/v1';
      case 'car':
      default:
        return 'https://routing.openstreetmap.de/routed-car/route/v1';
    }
  };

  const getOSMDirectionsUrl = () => {
    if (!destinationCoords) return 'https://www.openstreetmap.org';

    if (startCoords) {
      let engine = 'fossgis_osrm_car';
      if (transportMode === 'bike') engine = 'fossgis_osrm_bike';
      if (transportMode === 'walk') engine = 'fossgis_osrm_foot';

      return `https://www.openstreetmap.org/directions?engine=${engine}&route=${startCoords[0]}%2C${startCoords[1]}%3B${destinationCoords[0]}%2C${destinationCoords[1]}`;
    }

    return `https://www.openstreetmap.org/directions?to=${destinationCoords[0]}%2C${destinationCoords[1]}#map=13/${destinationCoords[0]}/${destinationCoords[1]}`;
  };

  // Convert seconds to human-readable duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins} mins`;
  };

  const formatDistance = (meters) => {
    if (!meters) return 'N/A';
    return `${(meters / 1000).toFixed(1)} km`;
  };

  if (loading) {
    return (
      <div className="status-container">
        <div className="spinner"></div>
        <p>Loading place details...</p>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="status-container error">
        <h2>Error</h2>
        <p>{error || 'Place not found'}</p>
        <Link to="/" className="back-link-btn">Back to Home</Link>
      </div>
    );
  }

  return (
    <main className="details-page">
      <div className="details-container">
        <header className="details-header">
          <Link to={backPath} state={{ page: location.state?.page || 1 }} className="back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            {backPath === '/admin' ? 'Back to Admin' : 'Back to Destinations'}
          </Link>
        </header>

        <section className="place-info-layout">
          <div className="place-info-panel">
            <div className="place-info-image-area">
              {place.image && place.image !== 'https://.....' ? (
                <img src={place.image} alt={place.name} className="place-details-img click-to-expand" onClick={() => setIsImageModalOpen(true)} />
              ) : (
                <div className="place-details-img-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
              )}
              <span className="details-state-badge">{place.state}</span>
            </div>

            <div className="place-info-details">
              <div className="place-info-title-row">
                <h1 className="place-details-title">{place.name}</h1>
                <div className="place-details-meta-sidebar">
                  <div className="place-details-rating">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>{place.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="place-details-city-row">
                {place.city ? (
                  <p className="place-details-city">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="city-marker-icon">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {place.city}, India
                  </p>
                ) : (
                  <div></div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={openTripModal}
                    className="place-details-trip-btn"
                    aria-label="Add to Trip"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '50px',
                      padding: '8px 16px',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add to Trip
                  </button>
                  <button 
                    onClick={handleWishlistToggle}
                    className={`place-details-wishlist-btn ${place.isWishlisted ? 'wishlisted' : ''}`}
                    aria-label={place.isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    {place.isWishlisted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="heart-icon-svg">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="heart-icon-svg">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <p className="place-details-description">{place.description}</p>

              <div className="place-details-meta-grid">
                <div className="meta-card">
                  <span className="meta-label">Best Time to Visit</span>
                  <span className="meta-value">{place.bestTime}</span>
                </div>
                <div className="meta-card">
                  <span className="meta-label">Entry Fee</span>
                  <span className="meta-value">
                    {place.entryFee === 0 ? 'Free Entry' : `₹ ${place.entryFee}`}
                  </span>
                </div>
              </div>

              {/* Weather Display Panel */}
              {loadingWeather && (
                <div className="weather-loading-container">
                  <div className="spinner-small"></div>
                  <span>Loading weather data...</span>
                </div>
              )}

              {!loadingWeather && weather && (
                <div className="weather-display-card">
                  <h3 className="weather-card-title-new">Current Weather</h3>
                  <div className="weather-overview">
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                      alt={weather.description} 
                      className="weather-icon-img"
                    />
                    <div className="temp-reading">
                      <span className="temp-number">{Math.round(weather.temp)}°C</span>
                      <span className="temp-desc">{weather.description}</span>
                    </div>
                  </div>
                  <div className="weather-stats">
                    <span>Humidity: {weather.humidity}%</span>
                    <span>Wind Speed: {weather.wind} m/s</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="place-map-panel">
            <h2 className="map-title">Plan Your Route</h2>
            <p className="map-description">
              Find directions to {place.name}. Select your starting point below.
            </p>

            <div className="map-controls-new">
              <div className="dropdown-container">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="start-loc-trigger-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="loc-btn-icon">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span className="btn-text-content">
                    {startName || 'Enter Start Location'}
                  </span>
                  <svg className={`chevron-icon ${dropdownOpen ? 'rotated' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="loc-dropdown-menu">
                    <form onSubmit={handleCustomSearch} className="dropdown-search-form">
                      <input
                        type="text"
                        placeholder="Search another place..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="dropdown-search-input"
                        autoFocus
                      />
                      <button type="submit" className="dropdown-search-btn" disabled={geocodingStart}>
                        {geocodingStart ? '...' : 'Search'}
                      </button>
                    </form>

                    <ul className="dropdown-options-list">
                      <li className="dropdown-option-item current-gps" onClick={handleUseCurrentLocation}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="dropdown-gps-icon">
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="3"></circle>
                          <line x1="12" y1="1" x2="12" y2="4"></line>
                          <line x1="12" y1="20" x2="12" y2="23"></line>
                          <line x1="1" y1="12" x2="4" y2="12"></line>
                          <line x1="20" y1="12" x2="23" y2="12"></line>
                        </svg>
                        <span className="option-text">Use current location</span>
                      </li>

                      {historyList.length > 0 && (
                        <li className="dropdown-divider-label">Frequent Starting Points</li>
                      )}

                      {historyList.map((item) => (
                        <li key={item} className="dropdown-option-item frequent-loc" onClick={() => handleHistorySelect(item)}>
                          <span className="option-text">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={handleGetRoute}
                className="get-route-btn-new"
                disabled={!startCoords || loadingMetrics}
              >
                {loadingMetrics ? 'Loading...' : 'Get Route'}
              </button>
            </div>

            {/* Travel Metrics Tabs */}
            {loadingMetrics && (
              <div className="metrics-loading-indicator">
                <div className="spinner-small"></div>
                <span>Fetching route options for Car, Bike, and Walk...</span>
              </div>
            )}

            {!loadingMetrics && showRoute && routeMetrics.car && (
              <div className="transport-metrics-grid">
                <button
                  type="button"
                  className={`transport-card ${transportMode === 'car' ? 'active' : ''}`}
                  onClick={() => setTransportMode('car')}
                >
                  <img src={carIcon} alt="Car" className="transport-card-img" />
                  <div className="transport-info">
                    <span className="transport-title">By Car</span>
                    <span className="transport-time">{formatDuration(routeMetrics.car.duration)}</span>
                    <span className="transport-distance">{formatDistance(routeMetrics.car.distance)}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`transport-card ${transportMode === 'bike' ? 'active' : ''}`}
                  onClick={() => setTransportMode('bike')}
                >
                  <img src={bikeIcon} alt="Bike" className="transport-card-img" />
                  <div className="transport-info">
                    <span className="transport-title">By Bike</span>
                    <span className="transport-time">{formatDuration(routeMetrics.bike?.duration)}</span>
                    <span className="transport-distance">{formatDistance(routeMetrics.bike?.distance)}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`transport-card ${transportMode === 'walk' ? 'active' : ''}`}
                  onClick={() => setTransportMode('walk')}
                >
                  <img src={walkIcon} alt="Walk" className="transport-card-img" />
                  <div className="transport-info">
                    <span className="transport-title">Walk</span>
                    <span className="transport-time">{formatDuration(routeMetrics.walk?.duration)}</span>
                    <span className="transport-distance">{formatDistance(routeMetrics.walk?.distance)}</span>
                  </div>
                </button>
              </div>
            )}

            <div className="leaflet-map-wrapper">
              {destinationCoords && (
                <a
                  href={getOSMDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="osm-floating-banner"
                  title="Open this route in OpenStreetMap"
                >
                  <span>🗺️ Open in OpenStreetMap.org ↗</span>
                </a>
              )}

              {destinationCoords ? (
                <MapContainer
                  center={destinationCoords}
                  zoom={12}
                  scrollWheelZoom={true}
                  className="leaflet-container-element"
                >
                  <MapClickHandler url={getOSMDirectionsUrl()} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Destination Marker */}
                  <Marker position={destinationCoords} icon={destinationIcon}>
                    <Popup>{place.name}</Popup>
                  </Marker>

                  {/* Start Marker */}
                  {startCoords && (
                    <Marker position={startCoords} icon={startIcon}>
                      <Popup>Your Starting Point: {startName}</Popup>
                    </Marker>
                  )}

                  {/* Route Polyline Engine */}
                  {showRoute && startCoords && (
                    <RoutingMachine
                      start={startCoords}
                      end={destinationCoords}
                      serviceUrl={getServiceUrl(transportMode)}
                    />
                  )}
                </MapContainer>
              ) : (
                <div className="map-loading-placeholder">
                  <div className="spinner"></div>
                  <p>Calculating coordinates...</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Trip Builder Modal */}
      {isTripModalOpen && (
        <div className="image-modal-overlay" onClick={() => setIsTripModalOpen(false)}>
          <div 
            className="image-modal-content" 
            style={{ 
              background: 'rgba(20, 20, 25, 0.95)', 
              padding: '2rem', 
              borderRadius: '15px', 
              width: '400px', 
              maxWidth: '90%', 
              maxHeight: '80vh', 
              overflowY: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.1)' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', margin: 0 }}>Add to Trip</h3>
              <button 
                onClick={() => setIsTripModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {loadingTrips ? (
              <div style={{ color: 'white', textAlign: 'center' }}>Loading trips...</div>
            ) : (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Planned Trips</h4>
                  {userTrips.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>No trips planned yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {userTrips.map(trip => (
                        <button
                          key={trip._id}
                          onClick={() => handleAddToExistingTrip(trip._id)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '1rem',
                            borderRadius: '8px',
                            color: 'white',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{trip.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                              {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                            </div>
                          </div>
                          <span style={{ fontSize: '1.2rem' }}>+</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

                {!isCreatingNewTrip ? (
                  <button
                    onClick={() => setIsCreatingNewTrip(true)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    + Create New Trip
                  </button>
                ) : (
                  <form onSubmit={handleCreateAndAddTrip} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h4 style={{ color: 'white', margin: 0 }}>Create Trip</h4>
                    
                    <div>
                      <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Trip Title</label>
                      <input 
                        type="text" 
                        required
                        value={newTripData.title}
                        onChange={e => setNewTripData({...newTripData, title: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white', boxSizing: 'border-box' }}
                        placeholder="e.g. Summer Vacation"
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>Start Date</label>
                        <input 
                          type="date" 
                          required
                          value={newTripData.startDate}
                          onChange={e => setNewTripData({...newTripData, startDate: e.target.value})}
                          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white', boxSizing: 'border-box', colorScheme: 'dark' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '5px' }}>End Date</label>
                        <input 
                          type="date" 
                          required
                          value={newTripData.endDate}
                          onChange={e => setNewTripData({...newTripData, endDate: e.target.value})}
                          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white', boxSizing: 'border-box', colorScheme: 'dark' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => setIsCreatingNewTrip(false)}
                        style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #444', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        style={{ flex: 2, padding: '10px', background: '#2563eb', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Save & Add Place
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Full-Screen Image Modal / Lightbox */}

      {isImageModalOpen && place.image && (
        <div className="image-modal-overlay" onClick={() => setIsImageModalOpen(false)}>
          <button className="image-modal-close-btn" onClick={() => setIsImageModalOpen(false)} aria-label="Close Preview">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="image-modal-close-icon">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={place.image} alt={place.name} className="image-modal-img" />
          </div>
        </div>
      )}
    </main>
  );
};

export default PlaceDetails;
