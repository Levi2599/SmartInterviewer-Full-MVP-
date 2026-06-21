const { callGeminiJson } = require('../geminiClient');

/**
 * Simulates a realistic job interview turn by evaluating the CV, JD, 
 * and conversation history to construct the next question.
 * @param {Object} input
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
    "You are an expert interviewer AI for SmartInterviewer. Simulate realistic, challenging job " +
    "interviews based on the candidate's CV and the target Job Description (JD). Calibrate the depth and tone to the role's seniority.\n\n" +
    "CORE RULES:\n" +
    "1. STATELESS: Generate exactly ONE focused, relevant question at a time representing the current turn.\n" +
    "2. METADATA: Classify every question you generate. Map it to one of these methodologies:\n" +
    "   - STAR (Situation, Task, Action, Result) for standard behavioral questions (e.g. asking about past experiences).\n" +
    "   - CAR (Context, Action, Result) for concise behavioral questions (e.g. focusing on context and direct action/impact).\n" +
    "   - PREP (Point, Reason, Example, Point) for conceptual/theoretical questions (e.g. explaining a paradigm or architecture).\n" +
    "   - Step-by-Step for technical execution questions (e.g. asking to outline the steps of implementing a feature or solving a coding problem).\n" +
    "3. EXTREME GAP RULE: If the candidate lacks experience or technical skills required in the JD, do NOT ask them to design or implement complex systems in that unknown technology. Instead, ask how they would approach learning it, or design a question that tests their foundational problem-solving or related concepts they do know.\n\n" +
    "Return ONLY valid JSON matching this schema:\n" +
    "{\n" +
    "  \"session_id\": \"string\",\n" +
    "  \"interviewer_persona\": \"string\",\n" +
    "  \"next_question\": \"string\",\n" +
    "  \"session_status\": \"active\",\n" +
    "  \"expected_method\": \"STAR\" | \"CAR\" | \"PREP\" | \"Step-by-Step\",\n" +
    "  \"type\": \"technical\" | \"behavioral\"\n" +
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
    directives: "Analyze candidate CV against JD. Detect key skill gaps. Select a gap or requirement to target. " +
                "Generate a single question. Determine the expected method (STAR/PREP/Step-by-Step) and type (technical/behavioral)."
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload);
}

module.exports = interviewProfilePrompt;