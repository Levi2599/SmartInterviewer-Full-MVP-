const { callGeminiJson } = require('../geminiClient');

/**
 * Cross-references candidate responses against historical tracking data 
 * to provide micro-coaching without repeating previous evaluation advice.
 * * @param {Object} input
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

  // 2. Define System Instructions
  const systemInstruction = 
    "You are an expert interview coach AI for SmartInterviewer. Detect which framework best fits " +
    "the answer: STAR, CAR, SOAR, PAR, SARI, DEAL, STEP_BY_STEP, or NONE. Analyze accordingly. " +
    "If the answer fits no framework, return framework_detected: \"NONE\". Feedback must be " +
    "specific, constructive, actionable, and nonjudgmental. The improvement_tip must be maximum " +
    "15 words long. Return ONLY valid JSON matching this schema:\n" +
    "{\n" +
    "  \"overall_score\": 0,\n" +
    "  \"framework_detected\": \"STAR\" | \"CAR\" | \"SOAR\" | \"PAR\" | \"SARI\" | \"DEAL\" | \"STEP_BY_STEP\" | \"NONE\",\n" +
    "  \"framework_analysis\": {},\n" +
    "  \"missing_components\": [\"string\"],\n" +
    "  \"improvement_tip\": \"string\"\n" +
    "}";

  // 3. Construct Stateless User Payload
  const userPayload = {
    question_context: input.question_text,
    candidate_answer: input.answer_text,
    target_framework_expectation: input.star_target || "STAR",
    topic_tag: input.topic_tag || "General Behavioral",
    exclusion_list: {
      do_not_repeat_these_feedback_points: input.previous_feedback_history
    }
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload);
}

module.exports = coachFeedbackPrompt;