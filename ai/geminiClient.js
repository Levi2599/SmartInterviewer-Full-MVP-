const { GoogleGenAI } = require("@google/genai");
const config = require("../config.js");

if (!config.GOOGLE_API_KEYS || config.GOOGLE_API_KEYS.length === 0) {
  throw new Error("GOOGLE_API_KEYS array is missing or empty in config.js");
}

const simulatorClients = (config.SIMULATOR_KEYS || []).map((key) => new GoogleGenAI({ apiKey: key }));
const coachClients = (config.COACH_KEYS || []).map((key) => new GoogleGenAI({ apiKey: key }));
const questionBankClients = (config.QUESTION_BANK_KEYS || []).map((key) => new GoogleGenAI({ apiKey: key }));
const recommendationsClients = (config.RECOMMENDATIONS_KEYS || []).map((key) => new GoogleGenAI({ apiKey: key }));
const defaultClients = config.GOOGLE_API_KEYS.map((key) => new GoogleGenAI({ apiKey: key }));

const agentClientsMap = {
  simulator: simulatorClients.length ? simulatorClients : defaultClients,
  coach: coachClients.length ? coachClients : defaultClients,
  questionBank: questionBankClients.length ? questionBankClients : defaultClients,
  recommendations: recommendationsClients.length ? recommendationsClients : defaultClients,
  default: defaultClients
};

const agentIndices = {
  simulator: 0,
  coach: 0,
  questionBank: 0,
  recommendations: 0,
  default: 0
};

const MODELS = [
  "gemini-2.5-flash",       // primary: best price/performance
  "gemini-2.5-flash-lite",  // fast lightweight fallback
  "gemini-3.5-flash",       // newest GA model
  "gemini-3.1-flash-lite",  // latest cost-efficient GA model
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error) {
  const message = error.message || "";

  return (
    message.includes('"code":503') ||
    message.includes('"status":"UNAVAILABLE"') ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("exhausted")
  );
}

function isModelNotFoundError(error) {
  const message = error.message || "";
  return (
    message.includes('"code":404') ||
    message.includes('"status":"NOT_FOUND"') ||
    message.includes("is not found for API version")
  );
}

async function generateWithRetry(model, systemInstruction, userPayload, agent = 'default') {
  const clientsList = agentClientsMap[agent] || agentClientsMap.default;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let rotationAttempts = 0;
    const maxRotations = clientsList.length;

    while (rotationAttempts < maxRotations) {
      const idx = agentIndices[agent] !== undefined ? agentIndices[agent] : 0;
      const currentClient = clientsList[idx];
      try {
        return await currentClient.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: JSON.stringify(userPayload),
                },
              ],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.4,
          },
        });
      } catch (error) {
        if (isRetryableGeminiError(error) && maxRotations > 1 && rotationAttempts < maxRotations - 1) {
          console.warn(`Rate limit or overload hit on agent ${agent} key index ${idx}, rotating key...`);
          agentIndices[agent] = (idx + 1) % clientsList.length;
          rotationAttempts++;
          continue; // Try immediately with the new rotated key
        }

        if (!isRetryableGeminiError(error) || attempt === maxAttempts) {
          throw error;
        }

        console.log(`Gemini ${model} overloaded for agent ${agent}. Retry ${attempt}/${maxAttempts} after sleep...`);
        await sleep(1500 * attempt);
        break; // Break the rotation loop to trigger the next attempt loop
      }
    }
  }
}

async function callGeminiJson(systemInstruction, userPayload, agent = 'default') {
  let lastError;

  for (const model of MODELS) {
    try {
      const response = await generateWithRetry(model, systemInstruction, userPayload, agent);
      const text = response.text;

      try {
        return JSON.parse(text);
      } catch (error) {
        throw new Error(`Gemini returned invalid JSON from ${model} for agent ${agent}`);
      }
    } catch (error) {
      lastError = error;

      if (isRetryableGeminiError(error) || isModelNotFoundError(error)) {
        console.log(`Switching Gemini model (${model} unavailable/overloaded) for agent ${agent}, trying next...`);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

module.exports = {
  callGeminiJson,
};