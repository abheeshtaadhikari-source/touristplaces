const mongoose = require('mongoose');

// Global caching for Vercel serverless functions
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is missing. Please set MONGO_URI in your Vercel Project Settings.');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      serverSelectionTimeoutMS: 15000,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
      console.log('MongoDB Connected Successfully');
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
