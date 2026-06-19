const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  session_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  user_id: { 
    type: String, 
    required: true 
  },
  cv_text: { 
    type: String 
  },
  jd_text: { 
    type: String 
  },
  transcript: { 
    type: [String], 
    default: [] 
  },
  star_scores: {
    S: { type: Number, default: 0 },
    T: { type: Number, default: 0 },
    A: { type: Number, default: 0 },
    R: { type: Number, default: 0 }
  },
  feedback_history: {
    type: [String],
    default: []
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

const SessionModel = mongoose.model('Session', SessionSchema);

/**
 * Inserts or updates an interview session.
 */
async function saveSession(sessionData) {
  return await SessionModel.findOneAndUpdate(
    { session_id: sessionData.session_id },
    sessionData,
    { new: true, upsert: true, runValidators: true }
  );
}

/**
 * Retrieves a specific session by its unique UUID/ID string.
 */
async function findBySessionId(sessionId) {
  return await SessionModel.findOne({ session_id: sessionId }).exec();
}

/**
 * Retrieves all interview sessions for a specific user.
 */
async function findByUserId(userId) {
  return await SessionModel.find({ user_id: userId }).exec();
}

module.exports = {
  SessionModel,
  saveSession,
  findBySessionId,
  findByUserId
};