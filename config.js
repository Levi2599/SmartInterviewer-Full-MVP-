// config.js
require("dotenv").config();

const simulatorKeys = [
  process.env.GOOGLE_API_KEY_1,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_5
].filter(Boolean);

const coachKeys = [
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_6
].filter(Boolean);

const questionBankKeys = [
  process.env.GOOGLE_API_KEY_7
].filter(Boolean);

const recommendationsKeys = [
  process.env.GOOGLE_API_KEY_8
].filter(Boolean);

const allKeys = [
  process.env.GOOGLE_API_KEY_1,
  process.env.GOOGLE_API_KEY_2,
  process.env.GOOGLE_API_KEY_3,
  process.env.GOOGLE_API_KEY_4,
  process.env.GOOGLE_API_KEY_5,
  process.env.GOOGLE_API_KEY_6,
  process.env.GOOGLE_API_KEY_7,
  process.env.GOOGLE_API_KEY_8
].filter(Boolean);

const config = {
  MONGODB_URI: process.env.MONGODB_URI,
  GOOGLE_API_KEYS: allKeys,
  PORT: process.env.PORT || 3001,
  SIMULATOR_KEYS: simulatorKeys.length ? simulatorKeys : allKeys,
  COACH_KEYS: coachKeys.length ? coachKeys : allKeys,
  QUESTION_BANK_KEYS: questionBankKeys.length ? questionBankKeys : allKeys,
  RECOMMENDATIONS_KEYS: recommendationsKeys.length ? recommendationsKeys : allKeys
};

module.exports = Object.freeze(config);