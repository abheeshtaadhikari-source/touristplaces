require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const Place = require('./models/Place');
const defaultPlaces = require('./tourist_places.json');
const placeRoutes = require('./routes/pleaceRoutes');
const assistantRoutes = require('./routes/assisstantRoutes');
const authRoutes = require('./routes/authRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Seeding function
const seedDatabase = async () => {
  try {
    const count = await Place.countDocuments();
    if (count === 0) {
      // Remove the placeholder "_id": "ObjectId" string so MongoDB creates valid native ObjectIds
      const cleanedPlaces = defaultPlaces.map(place => {
        const { _id, ...rest } = place;
        return rest;
      });
      await Place.insertMany(cleanedPlaces);
      console.log('Database successfully seeded with default tourist places!');
    } else {
      console.log('Database already populated. Skipping seeding.');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

// Mount Routes
app.use('/api/places', placeRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/itineraries', itineraryRoutes);

app.get('/', (req, res) => {
  res.send('Tourist Places Explorer API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  seedDatabase();
});
