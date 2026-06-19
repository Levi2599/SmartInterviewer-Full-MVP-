// config.js
require("dotenv").config();

const googleApiKeys = [
  process.env.GOOGLE_API_KEY_1,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4
].filter(Boolean);

const config = {
  MONGODB_URI: process.env.MONGODB_URI,
  GOOGLE_API_KEYS: googleApiKeys,
  PORT: process.env.PORT || 3001
};

module.exports = Object.freeze(config);