const { callGeminiJson } = require('../geminiClient');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT_PATH = path.join(__dirname, '../prompts/simulator_system.txt');
const SYSTEM_PROMPT_TEMPLATE = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');

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

  const lang = input.language || 'en';
  console.log("INTERVIEW PROFILE PROMPT INPUT LANG:", input.language);
  console.log("INTERVIEW PROFILE PROMPT RESOLVED LANG:", lang);
  const langInstruction = lang === 'he'
    ? "You MUST write the next_question and interviewer_persona fields in Hebrew (עברית) only. Even if the CV/JD context or history is in English, you MUST translate your questions and output to Hebrew."
    : "You MUST write all text fields in English.";

  // 2. Define System Instructions
  const systemInstruction = SYSTEM_PROMPT_TEMPLATE.replace('{{LANGUAGE_INSTRUCTION}}', langInstruction);
  console.log("INTERVIEW PROFILE PROMPT SYSTEM INSTRUCTION:", systemInstruction);

  // 3. Pick a random interview angle to ensure cross-session diversity
  const DIVERSITY_ANGLES = [
    "Focus on a TECHNICAL ARCHITECTURE or design decision — probe depth of judgment and trade-offs made.",
    "Focus on a CHALLENGE, FAILURE, or SETBACK the candidate faced — ask how they handled it and what they learned.",
    "Focus on TEAMWORK, COLLABORATION, or CROSS-TEAM coordination — probe communication and influence.",
    "Focus on OWNERSHIP or INITIATIVE the candidate demonstrated — ask about proactively identifying and solving a problem.",
    "Focus on SCALABILITY, PERFORMANCE, or OPTIMIZATION — probe specific metrics, bottlenecks, and impact.",
    "Focus on PROCESS IMPROVEMENT, CODE QUALITY, or OPERATIONAL EXCELLENCE — testing, reliability, or engineering practices.",
    "Focus on a difficult TRADE-OFF or CONFLICT the candidate navigated — technical debt vs. speed, security vs. UX, etc.",
    "Focus on GROWTH, LEARNING, or ADAPTING to a new technology, domain, or unexpected challenge.",
  ];
  const diversityAngle = DIVERSITY_ANGLES[Math.floor(Math.random() * DIVERSITY_ANGLES.length)];

  const languageMandate = lang === 'he'
    ? "IMPORTANT LANGUAGE MANDATE: You MUST write the next_question and interviewer_persona fields in Hebrew (עברית) only. "
    : "IMPORTANT LANGUAGE MANDATE: You MUST write the next_question and interviewer_persona fields in English. ";

  // 4. Construct Stateless User Payload
  const userPayload = {
    session_id: input.session_id,
    turn_number: input.turn_number,
    context: {
      candidate_cv: input.cv_text,
      target_job_description: input.jd_text
    },
    conversation_history: input.conversation_history,
    directives: languageMandate +
                "Analyze candidate CV against JD. Detect key skill gaps. Select a gap or requirement to target. " +
                "Generate a single question. Determine the expected method (STAR/CAR/PREP/Step-by-Step) and type (technical/behavioral). " +
                `DIVERSITY MANDATE: ${diversityAngle} ` +
                "ANTI-REPETITION: Never repeat a question or topic already covered in conversation_history."
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload, 'simulator');
}

module.exports = interviewProfilePrompt;