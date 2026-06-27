const { callGeminiJson } = require('../geminiClient');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../prompts/questionBank_system.txt');
const SYSTEM_PROMPT_TEMPLATE = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');

/**
 * Automates high-fidelity structured question generation for the application's question repository.
 * @param {Object} input
 * @returns {Promise<Array>} JSON Array matching Expected Output
 */
async function questionGenPrompt(input) {
  // 1. Strict Validation
  if (!input) {
    throw new Error('Input payload is required.');
  }
  if (typeof input.job_role !== 'string' || !input.job_role.trim()) {
    throw new Error('Invalid or empty job_role provided.');
  }
  if (typeof input.industry !== 'string' || !input.industry.trim()) {
    throw new Error('Invalid or empty industry provided.');
  }
  if (typeof input.seniority_level !== 'string' || !input.seniority_level.trim()) {
    throw new Error('Invalid or empty seniority_level provided.');
  }
  if (typeof input.question_count !== 'number' || input.question_count <= 0 || isNaN(input.question_count)) {
    throw new Error('Invalid question_count provided. Must be a positive number.');
  }

  let jdText = input.jd_text;
  if (typeof jdText !== 'string' || !jdText.trim()) {
    jdText = 'General role requirements';
  }

  const lang = input.language || 'en';
  const langInstruction = lang === 'he'
    ? "LANGUAGE: Write all text fields (text, competency, follow_ups, hr_keywords, red_flags) in Hebrew (עברית) only.\n\n"
    : "LANGUAGE: Write all text fields in English.\n\n";

  // 2. Define System Instructions
  const systemInstruction = SYSTEM_PROMPT_TEMPLATE.replace('{{LANGUAGE_INSTRUCTION}}', langInstruction);

  const languageMandate = lang === 'he'
    ? "IMPORTANT LANGUAGE MANDATE: You MUST write the generated questions, competency, follow_ups, hr_keywords, and red_flags in Hebrew (עברית) only. "
    : "IMPORTANT LANGUAGE MANDATE: You MUST write everything in English. ";

  // 3. Construct Stateless User Payload
  const userPayload = {
    target_role_specifications: {
      job_role: input.job_role,
      industry: input.industry,
      seniority_level: input.seniority_level,
      contextual_job_description: jdText
    },
    generation_constraints: {
      exact_question_count_to_generate: input.question_count,
      follow_ups_per_question: 2,
      required_action: languageMandate +
                       "Ensure absolute deduplication across the array. Calibrate structural depth to the seniority level. " +
                       "Classify each question as technical or behavioral. Set methodology_expectation (STAR for behavioral, CAR for concise behavioral, PREP for conceptual/theory, Step-by-Step for technical/coding). " +
                       "List Red Flags to watch out for in poor answers."
    }
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload, 'questionBank');
}

module.exports = questionGenPrompt;