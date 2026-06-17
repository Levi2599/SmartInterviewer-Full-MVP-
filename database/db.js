const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const config = require('../config.js');

let attempts = 0;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Establishes a connection to MongoDB with explicit pool size and retry mechanism.
 */
async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10
    });
    console.log('MongoDB connected');
    attempts = 0; // Reset attempts on successful connection
  } catch (error) {
    attempts++;
    console.error(`MongoDB connection error (Attempt ${attempts}/${MAX_ATTEMPTS}):`, error.message);
    
    if (attempts < MAX_ATTEMPTS) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB();
    } else {
      console.error('Max MongoDB connection attempts reached. Database connection failed.');
      throw error;
    }
  }
}

/**
 * Gracefully closes the MongoDB connection.
 */
async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  connectDB,
  dbInstance: mongoose.connection,
  closeDB
};