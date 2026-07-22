import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AddPlace = ({ onCancel, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    city: '',
    image: '',
    description: '',
    bestTime: '',
    entryFee: 0,
    rating: 0,
    location: '',
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'entryFee' || name === 'rating' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.state.trim()) {
      setError('Name and State are required fields.');
      return;
    }

    if (formData.rating < 0 || formData.rating > 5) {
      setError('Rating must be between 0.0 and 5.0.');
      return;
    }

    setError(null);
    setSubmitting(true);

    fetch('/api/places', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to create new tourist place. Check inputs.');
        }
        return res.json();
      })
      .then(() => {
        setSubmitting(false);
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        console.error('Submit error:', err);
        setError(err.message);
        setSubmitting(false);
      });
  };

  return (
    <div className="form-page">
      <div className="details-nav" style={{ maxWidth: '750px', margin: '0 auto 2rem auto' }}>
        <button className="back-link-btn" onClick={onCancel} aria-label="Go back to admin page">
          <svg className="back-arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Admin
        </button>
      </div>

      <div className="form-container">
        <header className="form-header">
          <h1 className="form-title">Add New Tourist Destination</h1>
          <p className="form-subtitle">Create a new detailed listing for the explorer directory.</p>
        </header>

        {error && (
          <div className="form-error-banner">
            <svg className="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="destination-form">
          <div className="form-grid">
            {/* Row 1 */}
            <div className="form-field full-width">
              <label htmlFor="name" className="form-label">Place Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="form-input"
                placeholder="e.g. Mysore Palace"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Row 2 */}
            <div className="form-field">
              <label htmlFor="state" className="form-label">State *</label>
              <input
                type="text"
                id="state"
                name="state"
                required
                className="form-input"
                placeholder="e.g. Karnataka"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="city" className="form-label">City</label>
              <input
                type="text"
                id="city"
                name="city"
                className="form-input"
                placeholder="e.g. Mysore"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            {/* Row 3 */}
            <div className="form-field full-width">
              <label htmlFor="image" className="form-label">Image URL</label>
              <input
                type="url"
                id="image"
                name="image"
                className="form-input"
                placeholder="e.g. https://images.pexels.com/... or leave blank"
                value={formData.image}
                onChange={handleChange}
              />
            </div>

            {/* Row 4 */}
            <div className="form-field">
              <label htmlFor="bestTime" className="form-label">Best Time to Visit</label>
              <input
                type="text"
                id="bestTime"
                name="bestTime"
                className="form-input"
                placeholder="e.g. October - February"
                value={formData.bestTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="entryFee" className="form-label">Entry Fee (INR)</label>
              <input
                type="number"
                id="entryFee"
                name="entryFee"
                min="0"
                className="form-input"
                placeholder="e.g. 100"
                value={formData.entryFee}
                onChange={handleChange}
              />
            </div>

            {/* Row 5 */}
            <div className="form-field">
              <label htmlFor="rating" className="form-label">Rating (0.0 to 5.0)</label>
              <input
                type="number"
                id="rating"
                name="rating"
                min="0"
                max="5"
                step="0.1"
                className="form-input"
                placeholder="e.g. 4.8"
                value={formData.rating || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="location" className="form-label">Location (Full Address)</label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-input"
                placeholder="e.g. Sayyaji Rao Road, Mysore, Karnataka"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            {/* Row 6 */}
            <div className="form-field full-width">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                className="form-textarea"
                placeholder="Write a brief overview of the destination history, attractions, and cultural significance..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="form-btn cancel-btn"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="form-btn submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Create Destination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlace;
