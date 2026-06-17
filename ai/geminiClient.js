const { GoogleGenAI } = require("@google/genai");
const config = require("../config.js");

if (!config.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
  apiKey: config.GOOGLE_API_KEY,
});

const MODELS = [
  "gemini-2.5-flash",
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
    message.includes("overloaded")
  );
}

async function generateWithRetry(model, systemInstruction, userPayload) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
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
      if (!isRetryableGeminiError(error) || attempt === maxAttempts) {
        throw error;
      }

      console.log(`Gemini ${model} overloaded. Retry ${attempt}/${maxAttempts}...`);
      await sleep(1500 * attempt);
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

      if (isRetryableGeminiError(error)) {
        console.log(`Switching Gemini model after overload: ${model}`);
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