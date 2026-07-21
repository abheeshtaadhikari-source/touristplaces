const express = require('express');
const router = express.Router();
const { getPlaces, searchPlaces, getPlaceById, createPlace, updatePlace, deletePlace, getPlaceWeather, toggleWishlist } = require('../controllers/placeController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');

router.get('/search', optionalProtect, searchPlaces);

router.get('/:id', optionalProtect, getPlaceById);

router.get('/:id/weather', getPlaceWeather);

router.patch('/:id/wishlist', protect, toggleWishlist);

router.get('/', optionalProtect, getPlaces);

router.post('/', protect, createPlace);

router.put('/:id', protect, updatePlace);

router.delete('/:id', protect, deletePlace);

module.exports = router;
