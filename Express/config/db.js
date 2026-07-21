const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000 // fail fast if connection fails
    };
    const conn = await mongoose.connect(process.env.MONGO_URI, opts);
    
    // Ensure connection is fully established (readyState === 1)
    if (conn.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('MongoDB connection handshake timed out')), 5000);
        conn.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

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
