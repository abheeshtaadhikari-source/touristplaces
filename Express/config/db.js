const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000 // fail fast if connection fails
    };
    const conn = await mongoose.connect(process.env.MONGO_URI, opts);
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
