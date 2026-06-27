const { callGeminiJson } = require('../geminiClient');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../prompts/recommendation_system.txt');
const SYSTEM_PROMPT_TEMPLATE = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');

/**
 * Generates personalized training plans and weakness pattern identification using Gemini AI.
 * @param {Object} input
 * @returns {Promise<Object>} JSON matching Expected Output
 */
async function recommendationPrompt(input) {
  // 1. Strict Validation
  if (!input) {
    throw new Error('Input payload is required.');
  }
  if (!Array.isArray(input.weakness_profile)) {
    throw new Error('Invalid weakness_profile provided. Must be an array.');
  }
  if (typeof input.session_count !== 'number' || isNaN(input.session_count)) {
    throw new Error('Invalid session_count provided. Must be a number.');
  }
  if (!input.star_breakdown || typeof input.star_breakdown !== 'object') {
    throw new Error('Invalid star_breakdown provided. Must be an object containing S, T, A, R metrics.');
  }
  if (!Array.isArray(input.session_history)) {
    throw new Error('Invalid session_history provided. Must be an array.');
  }

  const lang = input.language || 'en';
  const langInstruction = lang === 'he'
    ? "LANGUAGE: Write all text fields (detected_weakness_pattern, analysis_summary, focus_area, actionable_steps) in Hebrew (עברית) only.\n\n"
    : "LANGUAGE: Write all text fields in English.\n\n";

  // 2. Define System Instructions
  const systemInstruction = SYSTEM_PROMPT_TEMPLATE.replace('{{LANGUAGE_INSTRUCTION}}', langInstruction);

  const languageMandate = lang === 'he'
    ? "IMPORTANT LANGUAGE MANDATE: You MUST write all generated text fields (detected_weakness_pattern, analysis_summary, focus_area, actionable_steps) in Hebrew (עברית) only. "
    : "IMPORTANT LANGUAGE MANDATE: You MUST write all text fields in English. ";

  // 3. Construct Stateless User Payload
  const userPayload = {
    performance_metrics: {
      session_count: input.session_count,
      star_breakdown_averages: input.star_breakdown,
      overall_weakness_profile: input.weakness_profile
    },
    historical_sessions: input.session_history,
    directives: languageMandate +
                "Identify the primary conceptual, technical, or behavioral bottleneck in the candidate's history. " +
                "Summarize their trend. Recommend a primary focus area. Generate 3-5 concrete, actionable steps for improvement."
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload, 'recommendations');
}

module.exports = recommendationPrompt;