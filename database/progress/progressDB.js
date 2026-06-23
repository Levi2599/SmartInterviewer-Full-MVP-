const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  user_id: { 
    type: String, 
    required: true, 
    index: true 
  },
  session_id: { 
    type: String 
  },
  readiness_score: { 
    type: Number, 
    default: 0 
  },
  star_breakdown: {
    S: { type: Number, default: 0 },
    T: { type: Number, default: 0 },
    A: { type: Number, default: 0 },
    R: { type: Number, default: 0 }
  },
  weakness_tags: { 
    type: [String], 
    default: [] 
  },
  date: {
    type: Date,
    default: Date.now
  },
  recommendation_cache: {
    detected_weakness_pattern: { type: String, default: null },
    focus_area: { type: String, default: null },
    actionable_steps: { type: [String], default: [] },
    generated_at: { type: Date, default: null },
    session_count_at_generation: { type: Number, default: 0 }
  }
});

const ProgressModel = mongoose.model('Progress', ProgressSchema);

/**
 * Persists a user's benchmark evaluation performance record.
 */
async function saveProgress(progressData) {
  const progressInstance = new ProgressModel(progressData);
  return await progressInstance.save();
}

/**
 * Fetches the absolute latest historical evaluation point recorded for a user.
 */
async function findByUserId(userId) {
  return await ProgressModel.findOne({ user_id: userId })
    .sort({ date: -1 })
    .exec();
}

/**
 * Obtains a cronological array of historical metrics for charting timelines.
 */
async function getHistory(userId) {
  return await ProgressModel.find({ user_id: userId })
    .sort({ date: 1 })
    .exec();
}

async function updateRecommendationCache(userId, cacheData) {
  return await ProgressModel.updateMany(
    { user_id: userId },
    { $set: { recommendation_cache: cacheData } }
  );
}

module.exports = {
  ProgressModel,
  saveProgress,
  findByUserId,
  getHistory,
  updateRecommendationCache
};