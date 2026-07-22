import React, { useContext, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProfileDrawer from './ProfileDrawer';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">
            <img src={process.env.PUBLIC_URL + '/traveler.png'} alt="Traveler" />
          </span>
          <span className="logo-text">Bharat Nagar Explorer</span>
        </Link>
        <ul className="navbar-links">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              <span className="link-text">Home</span>
            </NavLink>
          </li>
          
          {user && (
            <li>
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="link-text">Admin</span>
              </NavLink>
            </li>
          )}



          {user ? (
            <li className="user-profile-nav">
              <button 
                className="nav-profile-btn" 
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Toggle profile drawer"
              >
                {getInitials(user.name)}
              </button>
            </li>
          ) : (
            <>
            </>
          )}
        </ul>
      </div>
      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </nav>
  );
};

export default Navbar;
