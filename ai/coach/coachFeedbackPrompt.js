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
  const lang = input.language || 'en';
  const langInstruction = lang === 'he'
    ? "LANGUAGE: Write the improvement_tip and all text fields in Hebrew (עברית) only.\n\n"
    : "LANGUAGE: Write all text fields in English.\n\n";

  // 2. Define System Instructions
  const systemInstruction =
    "You are an expert interview coach AI for SmartInterviewer. Evaluate the candidate's answer using the expected methodology.\n\n" +
    langInstruction +
    `EXPECTED METHODOLOGY: ${expectedMethod}\n\n` +
    "METHODOLOGY COMPONENT DEFINITIONS:\n" +
    "1. STAR: Situation (S), Task (T), Action (A), Result (R)\n" +
    "2. CAR: Context (S), Action (A), Result (R) -- Note: Task (T) is not used in CAR.\n" +
    "3. PREP: Point (S), Reason (T), Example (A), Point-Revisited (R)\n" +
    "4. Step-by-Step: Goal (S), Strategy (T), Analysis (A), Reporting (R)\n\n" +
    "STEP 1 — COMPONENT QUALITY SCORING (score each 0–100):\n" +
    "Assess the QUALITY of each component in the candidate's answer:\n" +
    "  0   : Component is COMPLETELY ABSENT — not mentioned at all.\n" +
    "  1–39: Component is mentioned but extremely vague, too brief, or unclear.\n" +
    "  40–69: Component is present and adequate but lacks depth, specifics, or impact.\n" +
    "  70–89: Component is clearly present with good detail and relevant context.\n" +
    "  90–100: Component is excellent — highly specific, measurable, and directly relevant to the question.\n" +
    "Important: score components based on whether they appear in the answer, not on whether the answer's content matches the question topic perfectly.\n" +
    "If the methodology is STAR, PREP, or Step-by-Step, score S, T, A, R.\n" +
    "If the methodology is CAR, score Context as S, Action as A, Result as R. You must score T as 0.\n\n" +
    "STEP 2 — MISSING COMPONENTS:\n" +
    "Add a component's name to missing_components ONLY if its score is 0 (completely absent).\n" +
    "For CAR: only assess Context, Action, Result. Do NOT include Task (T) in missing_components.\n\n" +
    "STEP 3 — FILLER WORDS:\n" +
    "Detect conversational crutch words: 'um', 'uh', 'like', 'so', 'you know', 'kind of', 'sort of', 'basically', 'אממ', 'כאילו', 'בעצם'.\n\n" +
    "STEP 4 — OVERALL SCORE CALCULATION (MANDATORY FORMULA):\n" +
    "For STAR, PREP, and Step-by-Step:\n" +
    "  overall_score = Math.round((S + T + A + R) / 4) - (5 * number_of_filler_words)\n" +
    "For CAR:\n" +
    "  overall_score = Math.round((S + A + R) / 3) - (5 * number_of_filler_words)\n" +
    "Clamp the result between 0 and 100.\n\n" +
    "COMPONENT → FIELD MAPPING (MANDATORY for UI compatibility):\n" +
    "- For STAR      : Situation→S, Task→T, Action→A, Result→R\n" +
    "- For CAR       : Context→S, Task→T (always 0), Action→A, Result→R\n" +
    "- For PREP      : Point→S, Reason→T, Example→A, Point-Revisited→R\n" +
    "- For Step-by-Step: Goal→S, Strategy→T, Analysis→A, Reporting→R\n\n" +
    "Return ONLY valid JSON matching this exact schema:\n" +
    "{\n" +
    "  \"overall_score\": number,\n" +
    "  \"framework_detected\": \"STAR\" | \"CAR\" | \"PREP\" | \"Step-by-Step\" | \"NONE\",\n" +
    "  \"star_breakdown\": { \"S\": number, \"T\": number, \"A\": number, \"R\": number },\n" +
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
