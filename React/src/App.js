import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PlaceDetails from './pages/PlaceDetails';
import Admin from './pages/Admin';
import AddPlace from './pages/AddPlace';
import EditPlace from './pages/EditPlace';
import AIWidget from './components/AIWidget';
import Footer from './components/Footer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';
import TripDetails from './pages/TripDetails';
import Trips from './pages/Trips';
import CreateTrip from './pages/CreateTrip';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Thin wrappers to interface older callbacks with React Router navigation hooks
const HomeWrapper = () => {
  const navigate = useNavigate();
  return <Home onSelectPlace={(id, page) => navigate(`/places/${id}`, { state: { from: '/', page } })} />;
};

const AdminWrapper = () => {
  const navigate = useNavigate();
  return (
    <Admin
      onAddPlace={() => navigate('/add-place')}
      onEditPlace={(id) => navigate(`/edit-place/${id}`)}
      onSelectPlace={(id) => navigate(`/places/${id}`, { state: { from: '/admin' } })}
    />
  );
};

const AddPlaceWrapper = () => {
  const navigate = useNavigate();
  return (
    <AddPlace
      onCancel={() => navigate('/admin')}
      onSuccess={() => navigate('/admin')}
    />
  );
};

const EditPlaceWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <EditPlace
      placeId={id}
      onCancel={() => navigate('/admin')}
      onSuccess={() => navigate('/admin')}
    />
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Route guard restricting access to logged-in administrator accounts
const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div className="map-loading-placeholder" style={{ height: '70vh' }}>
        <div className="spinner"></div>
        <p>Verifying admin permissions...</p>
      </div>
    );
  }
  
  if (!user || !user.isAdmin) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// A layout wrapper to conditionally hide Navbar and Footer on the Welcome page
const Layout = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <div className="spinner"></div>;
  }

  // Hide Navbar, Footer, and AIWidget on Welcome, Login, and Signup pages
  const isAuthOrWelcomePage = 
    (location.pathname === '/' && !user) || 
    location.pathname === '/login' || 
    location.pathname === '/signup';

  return (
    <div className="app-container">
      {!isAuthOrWelcomePage && <Navbar />}
      {children}
      {!isAuthOrWelcomePage && <Footer />}
      {!isAuthOrWelcomePage && <AIWidget />}
    </div>
  );
};

const AppContent = () => {
  const { user } = useContext(AuthContext);
  return (
    <Layout>
      <Routes>
        <Route path="/" element={user ? <HomeWrapper /> : <Welcome />} />
        <Route path="/places/:id" element={<PlaceDetails />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/create-trip" element={<CreateTrip />} />
        <Route path="/trips/:id" element={<TripDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected admin-only workspace paths */}
        <Route path="/admin" element={<AdminRoute><AdminWrapper /></AdminRoute>} />
        <Route path="/add-place" element={<AdminRoute><AddPlaceWrapper /></AdminRoute>} />
        <Route path="/edit-place/:id" element={<AdminRoute><EditPlaceWrapper /></AdminRoute>} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
