// config.js
require("dotenv").config();

const config = {
  MONGODB_URI: process.env.MONGODB_URI,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  PORT: process.env.PORT || 3001
};

module.exports = Object.freeze(config);