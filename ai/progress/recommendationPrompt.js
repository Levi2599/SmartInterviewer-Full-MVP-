const { callGeminiJson } = require('../geminiClient');

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

  // 2. Define System Instructions
  const systemInstruction = 
    "You are an expert career consultant AI for SmartInterviewer. Evaluate the candidate's historical interview " +
    "performance telemetry, including readiness scores, STAR breakdown averages, weaknesses, and transcript history. " +
    "Analyze their progress trend, identify recurring behavioral or technical patterns, and construct a targeted educational roadmap.\n\n" +
    "Return ONLY valid JSON matching this schema:\n" +
    "{\n" +
    "  \"detected_weakness_pattern\": \"string\",\n" +
    "  \"analysis_summary\": \"string\",\n" +
    "  \"strategic_recommendation\": {\n" +
    "    \"focus_area\": \"string\",\n" +
    "    \"actionable_steps\": [\"string\"]\n" +
    "  }\n" +
    "}";

  // 3. Construct Stateless User Payload
  const userPayload = {
    performance_metrics: {
      session_count: input.session_count,
      star_breakdown_averages: input.star_breakdown,
      overall_weakness_profile: input.weakness_profile
    },
    historical_sessions: input.session_history,
    directives: "Identify the primary conceptual, technical, or behavioral bottleneck in the candidate's history. " +
                "Summarize their trend. Recommend a primary focus area. Generate 3-5 concrete, actionable steps for improvement."
  };

  // 4. Dispatch to Gemini JSON Engine
  return await callGeminiJson(systemInstruction, userPayload);
}

module.exports = recommendationPrompt;