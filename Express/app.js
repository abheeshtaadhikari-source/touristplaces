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

// Middleware
app.use(express.json());

let isSeeded = false;

// Seeding function: Ensure all places from tourist_places.json exist in MongoDB
const seedDatabase = async () => {
  if (isSeeded) return;
  try {
    const existingPlaces = await Place.find({}, 'name');
    const existingNames = new Set(existingPlaces.map(p => p.name));

    const missingPlaces = defaultPlaces.filter(p => !existingNames.has(p.name)).map(place => {
      const { _id, ...rest } = place;
      return rest;
    });

    if (missingPlaces.length > 0) {
      await Place.insertMany(missingPlaces);
      console.log(`Successfully seeded ${missingPlaces.length} missing tourist places to MongoDB!`);
    } else {
      console.log('All default tourist places are present in MongoDB.');
    }
    isSeeded = true;
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

// Ensure MongoDB is connected and seeded before handling any requests (Crucial for Vercel Serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await seedDatabase();
    next();
  } catch (err) {
    console.error('Database Connection Failed:', err.message);
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

// Mount Routes
app.use('/api/places', placeRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/itineraries', itineraryRoutes);

app.get('/', (req, res) => {
  res.send('Tourist Places Explorer API is running');
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    seedDatabase();
  });
}

module.exports = app;
