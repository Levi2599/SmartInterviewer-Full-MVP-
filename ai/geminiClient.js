const { GoogleGenAI } = require("@google/genai");
const config = require("../config.js");

if (!config.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
  apiKey: config.GOOGLE_API_KEY,
});

async function callGeminiJson(systemInstruction, userPayload) {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-turbo-flash-001",
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

  const text = response.text;

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("Gemini returned invalid JSON");
  }
}

module.exports = {
  callGeminiJson,
};