const { GoogleGenAI } = require("@google/genai");
const config = require("../config.js");

if (!config.GOOGLE_API_KEYS || config.GOOGLE_API_KEYS.length === 0) {
  throw new Error("GOOGLE_API_KEYS array is missing or empty in config.js");
}

const clients = config.GOOGLE_API_KEYS.map((key) => new GoogleGenAI({ apiKey: key }));
let activeClientIndex = 0;

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
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

async function generateWithRetry(model, systemInstruction, userPayload) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let rotationAttempts = 0;
    const maxRotations = clients.length;

    while (rotationAttempts < maxRotations) {
      const currentClient = clients[activeClientIndex];
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
          console.warn(`Rate limit or overload hit on key index ${activeClientIndex}, rotating key...`);
          activeClientIndex = (activeClientIndex + 1) % clients.length;
          rotationAttempts++;
          continue; // Try immediately with the new rotated key
        }

        if (!isRetryableGeminiError(error) || attempt === maxAttempts) {
          throw error;
        }

        console.log(`Gemini ${model} overloaded. Retry ${attempt}/${maxAttempts} after sleep...`);
        await sleep(1500 * attempt);
        break; // Break the rotation loop to trigger the next attempt loop
      }
    }
  }
}

async function callGeminiJson(systemInstruction, userPayload) {
  let lastError;

  for (const model of MODELS) {
    try {
      const response = await generateWithRetry(model, systemInstruction, userPayload);
      const text = response.text;

      try {
        return JSON.parse(text);
      } catch (error) {
        throw new Error(`Gemini returned invalid JSON from ${model}`);
      }
    } catch (error) {
      lastError = error;

      if (isRetryableGeminiError(error) || isModelNotFoundError(error)) {
        console.log(`Switching Gemini model (${model} unavailable/overloaded), trying next...`);
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