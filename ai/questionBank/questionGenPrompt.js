const { callGeminiJson } = require('../geminiClient');

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

  // 2. Define System Instructions
  const systemInstruction = 
    "You are an expert HR consultant AI for SmartInterviewer. Generate high-quality structured " +
    "interview questions for recruiters using behavioral and technical best practices. Return ONLY a valid JSON " +
    "array where every element matches the following item schema exactly:\n" +
    "[\n" +
    "  {\n" +
    "    \"text\": \"string\",\n" +
    "    \"type\": \"technical\" | \"behavioral\",\n" +
    "    \"competency\": \"string\",\n" +
    "    \"methodology_expectation\": \"STAR\" | \"PREP\" | \"Step-by-Step\",\n" +
    "    \"follow_ups\": [\"string\"],\n" +
    "    \"hr_keywords\": [\"string\"],\n" +
    "    \"red_flags\": [\"string\"]\n" +
    "  }\n" +
    "]";

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
      required_action: "Ensure absolute deduplication across the array. Calibrate structural depth to the seniority level. " +
                       "Classify each question as technical or behavioral. Set methodology_expectation (STAR for behavioral, PREP for conceptual/theory, Step-by-Step for technical/coding). " +
                       "List Red Flags to watch out for in poor answers."
    }
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload);
}

module.exports = questionGenPrompt;