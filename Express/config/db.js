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
    const mongoUri = process.env.MONGO_URI || 'mongodb://abheeshtaadhikari_db_user:mDoHECrSLZEbqiiA@ac-ki79esg-shard-00-00.dcdavg1.mongodb.net:27017,ac-ki79esg-shard-00-01.dcdavg1.mongodb.net:27017,ac-ki79esg-shard-00-02.dcdavg1.mongodb.net:27017/?ssl=true&replicaSet=atlas-sfxc1m-shard-0&authSource=admin&appName=Cluster0&compressors=zlib';
    const conn = await mongoose.connect(mongoUri, opts);
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
