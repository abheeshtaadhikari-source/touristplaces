const Itinerary = require('../models/Itinerary');

// @desc    Get user's itineraries
// @route   GET /api/itineraries
// @access  Private
exports.getItineraries = async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ user: req.user._id })
      .populate('places')
      .sort({ createdAt: -1 });
    res.status(200).json(itineraries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new itinerary
// @route   POST /api/itineraries
// @access  Private
exports.createItinerary = async (req, res) => {
  try {
    const { title, startDate, endDate, places } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please add all required fields.' });
    }

    const itinerary = await Itinerary.create({
      user: req.user._id,
      title,
      startDate,
      endDate,
      places: places || []
    });

    const populated = await itinerary.populate('places');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single itinerary
// @route   GET /api/itineraries/:id
// @access  Private
exports.getItineraryById = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id).populate('places');

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Make sure user owns itinerary
    if (itinerary.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    res.status(200).json(itinerary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update itinerary
// @route   PUT /api/itineraries/:id
// @access  Private
exports.updateItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Make sure user owns itinerary
    if (itinerary.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedItinerary = await Itinerary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after' }
    ).populate('places');

    res.status(200).json(updatedItinerary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete itinerary
// @route   DELETE /api/itineraries/:id
// @access  Private
exports.deleteItinerary = async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);

    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary not found' });
    }

    // Make sure user owns itinerary
    if (itinerary.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await Itinerary.deleteOne({ _id: req.params.id });

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
