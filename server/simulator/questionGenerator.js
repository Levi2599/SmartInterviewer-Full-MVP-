const express = require('express');
const router = express.Router();
const interviewProfilePrompt = require("../../ai/simulator/interviewProfilePrompt");
const { saveSession } = require("../../database/simulator/sessionDB");

function detectLanguage(text) {
  const heChars = (text.match(/[֐-׿]/g) || []).length;
  const total = text.replace(/\s/g, '').length;
  return total > 0 && heChars / total > 0.25 ? 'he' : 'en';
}

router.post('/', async (req, res, next) => { // Handled standard express params
  try {
    const { cv_text, jd_text, session_id, turn_number, conversation_history } = req.body;

    if (!cv_text || !jd_text) {
      return res.status(400).json({ error: "cv_text and jd_text are required fields." });
    }

    const language = detectLanguage(jd_text + ' ' + cv_text);

    // Call AI layer to generate interview configuration or next question
    const aiResponse = await interviewProfilePrompt({
      cv_text,
      jd_text,
      session_id,
      turn_number: turn_number || 1,
      conversation_history: conversation_history || [],
      language
    });

    // Save session snapshot to the database layer
    const userId = session_id ? session_id.split('-').slice(0, -1).join('-') : 'user-001';
    const transcript = (conversation_history || []).map(item => `${item.role}: ${item.text}`);

    await saveSession({
      session_id,
      user_id: userId,
      cv_text,
      jd_text,
      transcript
    });

    return res.json(aiResponse);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;