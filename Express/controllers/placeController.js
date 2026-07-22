const Place = require('../models/Place');
const User = require('../models/User');

// @desc    Get all tourist places
// @route   GET /api/places
// @access  Public
const getPlaces = async (req, res) => {
  try {
    const places = await Place.find();
    if (req.user) {
      const wishlistSet = new Set(req.user.wishlist.map(id => id.toString()));
      const placesWithWishlist = places.map(place => {
        const placeObj = place.toObject();
        placeObj.isWishlisted = wishlistSet.has(place._id.toString());
        return placeObj;
      });
      return res.status(200).json(placesWithWishlist);
    }
    const anonymousPlaces = places.map(place => {
      const placeObj = place.toObject();
      placeObj.isWishlisted = false;
      return placeObj;
    });
    res.status(200).json(anonymousPlaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search tourist places by name
// @route   GET /api/places/search
// @access  Public
const searchPlaces = async (req, res) => {
  try {
    const keyword = req.query.name || '';
    const places = await Place.find({
      name: {
        $regex: keyword,
        $options: 'i'
      }
    });
    if (req.user) {
      const wishlistSet = new Set(req.user.wishlist.map(id => id.toString()));
      const placesWithWishlist = places.map(place => {
        const placeObj = place.toObject();
        placeObj.isWishlisted = wishlistSet.has(place._id.toString());
        return placeObj;
      });
      return res.status(200).json(placesWithWishlist);
    }
    const anonymousPlaces = places.map(place => {
      const placeObj = place.toObject();
      placeObj.isWishlisted = false;
      return placeObj;
    });
    res.status(200).json(anonymousPlaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single tourist place by ID
// @route   GET /api/places/:id
// @access  Public
const getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: 'Tourist place not found' });
    }
    const placeObj = place.toObject();
    if (req.user) {
      placeObj.isWishlisted = req.user.wishlist.map(id => id.toString()).includes(place._id.toString());
    } else {
      placeObj.isWishlisted = false;
    }
    res.status(200).json(placeObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a tourist place
// @route   POST /api/places
// @access  Public
const createPlace = async (req, res) => {
  try {
    const place = await Place.create(req.body);
    res.status(201).json(place);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a tourist place
// @route   PUT /api/places/:id
// @access  Public
const updatePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true
    });
    if (!place) {
      return res.status(404).json({ message: 'Tourist place not found' });
    }
    res.status(200).json(place);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a tourist place
// @route   DELETE /api/places/:id
// @access  Public
const deletePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id);
    if (!place) {
      return res.status(404).json({ message: 'Tourist place not found' });
    }
    res.status(200).json({ message: 'Tourist place removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get weather for a tourist place
// @route   GET /api/places/:id/weather
// @access  Public
const getPlaceWeather = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: 'Tourist place not found' });
    }

    const queryCity = place.city || place.name;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: 'Weather API key is missing on the server.' });
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryCity)},IN&units=metric&appid=${apiKey}`
    );
    const weatherData = await response.json();

    if (weatherData.cod !== 200) {
      return res.status(weatherData.cod).json({ message: weatherData.message });
    }

    res.status(200).json({
      temp: weatherData.main.temp,
      feels_like: weatherData.main.feels_like,
      humidity: weatherData.main.humidity,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      wind: weatherData.wind.speed
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle wishlist status for a tourist place
// @route   PATCH /api/places/:id/wishlist
// @access  Public
const toggleWishlist = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: 'Tourist place not found' });
    }
    
    const user = req.user;
    const index = user.wishlist.indexOf(place._id);
    let isWishlistedNow = false;
    
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(place._id);
      isWishlistedNow = true;
    }
    
    await user.save();
    
    const placeObj = place.toObject();
    placeObj.isWishlisted = isWishlistedNow;
    
    res.status(200).json(placeObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPlaces,
  searchPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  getPlaceWeather,
  toggleWishlist
};