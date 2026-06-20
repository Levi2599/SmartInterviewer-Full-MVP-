const mongoose = require('mongoose');

const IndividualQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['technical', 'behavioral'], default: 'behavioral' },
  competency: { type: String },
  methodology_expectation: { type: String, enum: ['STAR', 'PREP', 'Step-by-Step'], default: 'STAR' },
  follow_ups: { type: [String], default: [] },
  hr_keywords: { type: [String], default: [] },
  red_flags: { type: [String], default: [] }
}, { _id: false });

const QuestionBankSchema = new mongoose.Schema({
  question_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  job_role: { 
    type: String, 
    index: true 
  },
  industry: { 
    type: String 
  },
  seniority_level: { 
    type: String 
  },
  questions_array: [IndividualQuestionSchema],
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

const QuestionBankModel = mongoose.model('QuestionBank', QuestionBankSchema);

/**
 * Saves or updates a predefined set of interview questions.
 */
async function saveQuestionSet(questionBankData) {
  return await QuestionBankModel.findOneAndUpdate(
    { question_id: questionBankData.question_id },
    questionBankData,
    { new: true, upsert: true, runValidators: true }
  );
}

/**
 * Finds a question bank collection by its specific question_id.
 */
async function findById(questionId) {
  return await QuestionBankModel.findOne({ question_id: questionId }).exec();
}

/**
 * Searches for question banks targeted towards a specific job role.
 */
async function findByRole(jobRole) {
  return await QuestionBankModel.find({ job_role: jobRole }).exec();
}

module.exports = {
  QuestionBankModel,
  saveQuestionSet,
  findById,
  findByRole
};