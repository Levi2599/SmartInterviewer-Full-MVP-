const { callGeminiJson } = require('../geminiClient');

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

  // 2. Define System Instructions
  const systemInstruction = 
    "You are an expert interview coach AI for SmartInterviewer. Evaluate the candidate's answer using the expected methodology.\n\n" +
    `EXPECTED METHODOLOGY: ${expectedMethod}\n\n` +
    "METHODOLOGY COMPONENT RULES:\n" +
    "1. STAR: Situation (S), Task (T), Action (A), Result (R)\n" +
    "2. PREP: Point (P), Reason (R), Example (E), Point (P)\n" +
    "3. Step-by-Step: Goal (G), Strategy (S), Analysis (A), Reporting (R)\n\n" +
    "SCORING RULE (Base 100):\n" +
    "- Start at 100 points.\n" +
    "- Deduct 20 points for each missing component in the target methodology. Assess which components are present and which are missing.\n" +
    "- Deduct 5 points for each filler word detected in the answer. Filler words include conversational pauses or crutch words such as: 'אממ', 'כאילו', 'like', 'so', 'um', 'uh', etc.\n" +
    "- Ensure overall_score is calculated as: 100 - (20 * number of missing components) - (5 * number of filler words detected). Clamped between 0 and 100.\n\n" +
    "UI COMPATIBILITY BRIDGE (MANDATORY):\n" +
    "To prevent breaking the frontend charts, you MUST map the score (0-100) of each component of the target methodology to the S, T, A, R fields in the 'star_breakdown' object as follows:\n" +
    "- For STAR: Map Situation to S, Task to T, Action to A, Result to R.\n" +
    "- For PREP: Map Point 1 to S, Reason to T, Example to A, Point 2 to R.\n" +
    "- For Step-by-Step: Map Goal to S, Strategy to T, Analysis to A, Reporting to R.\n\n" +
    "Return ONLY valid JSON matching this schema:\n" +
    "{\n" +
    "  \"overall_score\": number,\n" +
    "  \"framework_detected\": \"STAR\" | \"PREP\" | \"Step-by-Step\" | \"NONE\",\n" +
    "  \"star_breakdown\": {\n" +
    "    \"S\": number,\n" +
    "    \"T\": number,\n" +
    "    \"A\": number,\n" +
    "    \"R\": number\n" +
    "  },\n" +
    "  \"missing_components\": [\"string\"],\n" +
    "  \"fillers_detected\": [\"string\"],\n" +
    "  \"improvement_tip\": \"string\"\n" +
    "}";

  // 3. Construct Stateless User Payload
  const userPayload = {
    question_context: input.question_text,
    candidate_answer: input.answer_text,
    target_framework_expectation: expectedMethod,
    topic_tag: input.topic_tag || "General Behavioral",
    exclusion_list: {
      do_not_repeat_these_feedback_points: input.previous_feedback_history
    }
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload);
}

module.exports = coachFeedbackPrompt;