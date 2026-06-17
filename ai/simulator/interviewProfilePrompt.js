const { callGeminiJson } = require('../geminiClient');

/**
 * Simulates a realistic job interview turn by evaluating the CV, JD, 
 * and conversation history to construct the next question.
 * * @param {Object} input
 * @returns {Promise<Object>} JSON matching Expected Output
 */
async function interviewProfilePrompt(input) {
  // 1. Strict Validation
  if (!input) {
    throw new Error('Input payload is required.');
  }
  if (typeof input.cv_text !== 'string' || !input.cv_text.trim()) {
    throw new Error('Invalid or empty cv_text provided.');
  }
  if (typeof input.jd_text !== 'string' || !input.jd_text.trim()) {
    throw new Error('Invalid or empty jd_text provided.');
  }
  if (typeof input.session_id !== 'string' || !input.session_id.trim()) {
    throw new Error('Invalid or empty session_id provided.');
  }
  if (typeof input.turn_number !== 'number' || isNaN(input.turn_number)) {
    throw new Error('Invalid turn_number provided. Must be a number.');
  }
  if (!Array.isArray(input.conversation_history)) {
    throw new Error('Invalid conversation_history provided. Must be an array.');
  }

  // 2. Define System Instructions
  const systemInstruction = 
    "You are an expert interviewer AI for SmartInterviewer. Simulate realistic behavioral job " +
    "interviews using STAR, CAR, SOAR, PAR, SARI, DEAL, or Step-by-Step methodology. Select the " +
    "most appropriate framework based on the question type and candidate context. Generate one " +
    "question at a time. Return ONLY valid JSON matching this schema:\n" +
    "{\n" +
    "  \"session_id\": \"string\",\n" +
    "  \"interviewer_persona\": \"string\",\n" +
    "  \"next_question\": \"string\",\n" +
    "  \"session_status\": \"active\"\n" +
    "}";

  // 3. Construct Stateless User Payload
  const userPayload = {
    session_id: input.session_id,
    turn_number: input.turn_number,
    context: {
      candidate_cv: input.cv_text,
      target_job_description: input.jd_text
    },
    conversation_history: input.conversation_history,
    directives: "Identify structural gaps between the candidate CV and the Job Description requirements. " +
                "Formulate a tactical, single question targeted at exposing or clarifying that gap. " +
                "Prefer behavioral inquiries using STAR principles. Ensure the output contains no markdown wrap."
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload);
}

module.exports = interviewProfilePrompt;