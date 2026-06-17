const express = require('express');
const router = express.Router();
const interviewProfilePrompt = require("../../ai/simulator/interviewProfilePrompt");
const { saveSession } = require("../../database/simulator/sessionDB");

router.post('/', async (req, res, next) => { // Handled standard express params
  try {
    const { cv_text, jd_text, session_id, turn_number, conversation_history } = req.body;

    if (!cv_text || !jd_text) {
      return res.status(400).json({ error: "cv_text and jd_text are required fields." });
    }

    // Call AI layer to generate interview configuration or next question
    const aiResponse = await interviewProfilePrompt({
      cv_text,
      jd_text,
      session_id,
      turn_number: turn_number || 1,
      conversation_history: conversation_history || []
    });

    // Save session snapshot to the database layer
    await saveSession({
      session_id,
      turn_number,
      conversation_history,
      ai_response: aiResponse,
      updated_at: new Date()
    });

    return res.json(aiResponse);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;