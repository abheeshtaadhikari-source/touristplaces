const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  // Return cached connection if it's alive
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,  // 30s for Vercel cold-start
      socketTimeoutMS: 45000,           // 45s socket timeout
      connectTimeoutMS: 30000,          // 30s connection timeout
      maxPoolSize: 10,
      minPoolSize: 1,
    };
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from environment variables. Please add MONGO_URI in your Vercel Project Settings -> Environment Variables.');
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, opts);
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    cachedConnection = null; // Reset cache on failure
    throw error;
  }
};

module.exports = connectDB;
