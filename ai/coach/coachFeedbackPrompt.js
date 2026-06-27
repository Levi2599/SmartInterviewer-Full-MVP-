const { callGeminiJson } = require('../geminiClient');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../prompts/coach_system.txt');
const SYSTEM_PROMPT_TEMPLATE = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');

/**
 * Cross-references candidate responses against historical tracking data 
 * to provide micro-coaching without repeating previous evaluation advice.
 * @param {Object} input
 * @returns {Promise<Object>} JSON matching Expected Output
 */
async function coachFeedbackPrompt(input) {
  // 1. Strict Validation
  if (!input) {
    throw new Error('Input payload is required.');
  }
  if (typeof input.answer_text !== 'string' || !input.answer_text.trim()) {
    throw new Error('Invalid or empty answer_text provided.');
  }
  if (typeof input.question_text !== 'string' || !input.question_text.trim()) {
    throw new Error('Invalid or empty question_text provided.');
  }
  if (!Array.isArray(input.previous_feedback_history)) {
    throw new Error('Invalid previous_feedback_history provided. Must be an array.');
  }

  const expectedMethod = input.expected_method || "STAR";
  const lang = input.language || 'en';
  const langInstruction = lang === 'he'
    ? "You MUST write the improvement_tip and all text fields in Hebrew (עברית) only. Even if the question and answer are in English, you MUST translate your feedback and output to Hebrew."
    : "You MUST write all text fields in English.";

  // 2. Define System Instructions
  const systemInstruction = SYSTEM_PROMPT_TEMPLATE
    .replace('{{LANGUAGE_INSTRUCTION}}', langInstruction)
    .replace('{{EXPECTED_METHODOLOGY}}', expectedMethod);

  const languageMandate = lang === 'he'
    ? "IMPORTANT LANGUAGE MANDATE: You MUST write the improvement_tip and all feedback text fields in Hebrew (עברית) only. Even if the question and answer are in English, you MUST translate your feedback and output to Hebrew."
    : "IMPORTANT LANGUAGE MANDATE: You MUST write all feedback text fields in English.";

  // 3. Construct Stateless User Payload
  const userPayload = {
    question_context: input.question_text,
    candidate_answer: input.answer_text,
    target_framework_expectation: expectedMethod,
    topic_tag: input.topic_tag || "General Behavioral",
    exclusion_list: {
      do_not_repeat_these_feedback_points: input.previous_feedback_history
    },
    directives: languageMandate + " Evaluate the candidate_answer against the question_context using the target_framework_expectation. Detect missing components and filler words, compute scores, and provide a clear, actionable improvement tip."
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload, 'coach');
}

module.exports = coachFeedbackPrompt;
