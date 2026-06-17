const express = require('express');
const router = express.Router();
const coachFeedbackPrompt = require("../../ai/coach/coachFeedbackPrompt");
const { findBySessionId } = require("../../database/simulator/sessionDB");

router.post('/', async (req, res) => {
  const start = Date.now();
  try {
    const { answer_text, question_text, star_target, topic_tag, session_id } = req.body;

    if (!answer_text || !question_text) {
      return res.status(400).json({ error: "answer_text and question_text are required." });
    }

    let previous_feedback_history = [];
    if (session_id) {
      const existingSession = await findBySessionId(session_id);
      if (existingSession && existingSession.feedback_history) {
        previous_feedback_history = existingSession.feedback_history;
      }
    }

    const feedbackResult = await coachFeedbackPrompt({
      answer_text,
      question_text,
      star_target,
      topic_tag,
      previous_feedback_history
    });

    console.log(`Coach latency: ${Date.now() - start}ms`);
    return res.json(feedbackResult);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;