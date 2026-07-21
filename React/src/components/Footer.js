import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-root">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Logo & Description */}
          <div className="footer-brand">
            <h3 className="footer-logo">Tourist Places</h3>
            <p className="footer-desc">
              Discover and explore breathtaking Indian destinations, historical monuments, and serene escapes with real-time weather analytics and route planners.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links-group">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/admin">Admin</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="footer-links-group">
            <h4 className="footer-heading">Features</h4>
            <ul className="footer-links-list">
              <li><span>Weather Forecast</span></li>
              <li><span>Route Planning</span></li>
              <li><span>Interactive AI Guide</span></li>
              <li><span>Trip Planning</span></li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="footer-socials">
            <h4 className="footer-heading">Follow Us</h4>
            <div className="social-icons-row">
              <a href="https://github.com/abheeshtaadhikari-source" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="GitHub">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a href="https://www.linkedin.com/in/abheeshtaadhikari" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=abheeshta.adhikari@gmail.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn" aria-label="Email">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} Tourist Places. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
