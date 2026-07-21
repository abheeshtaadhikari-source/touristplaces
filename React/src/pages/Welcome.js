import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';

const Welcome = () => {
  const [places, setPlaces] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/places')
      .then((res) => res.json())
      .then((data) => {
        // filter out invalid images
        const validPlaces = data.filter(p => p.image && p.image !== 'https://.....' && p.image.startsWith('http'));
        // duplicate to have enough floating images
        let extendedPlaces = [...validPlaces];
        while (extendedPlaces.length < 30 && extendedPlaces.length > 0) {
          extendedPlaces = [...extendedPlaces, ...validPlaces];
        }
        setPlaces(extendedPlaces.slice(0, 30));
      })
      .catch((err) => console.error('Error fetching places:', err));
  }, []);

  return (
    <div className="welcome-container">
      {/* Background Floating Images */}
      <div className="welcome-bg">
        {places.map((place, idx) => {
          const animationDelay = Math.random() * -5;
          const animationDuration = Math.random() * 3 + 4;
          const size = Math.random() * 40 + 80; // 80px to 120px
          const offsetX = Math.random() * 40 - 20; // offset of -20px to 20px
          const offsetY = Math.random() * 40 - 20; // offset of -20px to 20px

          return (
            <div
              key={idx}
              className="welcome-floating-cell"
              style={{
                animationDelay: `${animationDelay}s`,
                animationDuration: `${animationDuration}s`,
              }}
            >
              <img
                src={place.image}
                alt="Destination background"
                className="welcome-floating-img"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  transform: `translate(${offsetX}px, ${offsetY}px)`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Blue Gradient Overlay */}
      <div className="welcome-overlay"></div>

      {/* Centered Content */}
      <div className="welcome-content">
        <h1 className="welcome-title">
          <span className="bold-namaste">Namaste!</span> About to surf in
        </h1>
        <div className="welcome-logo-row">
          <img src={process.env.PUBLIC_URL + '/traveler.png'} alt="Website Icon" className="welcome-logo-icon" />
          <span className="welcome-logo-text">Bharat Nagar Explorer</span>
        </div>
        <div className="welcome-buttons">
          <button className="welcome-btn login-btn" onClick={() => navigate('/login')}>
            Log In
          </button>
          <button className="welcome-btn signup-btn" onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
