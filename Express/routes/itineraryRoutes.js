const express = require('express');
const router = express.Router();
const { getItineraries, createItinerary, getItineraryById, updateItinerary, deleteItinerary } = require('../controllers/itineraryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getItineraries)
  .post(protect, createItinerary);

router.route('/:id')
  .get(protect, getItineraryById)
  .put(protect, updateItinerary)
  .delete(protect, deleteItinerary);

module.exports = router;
