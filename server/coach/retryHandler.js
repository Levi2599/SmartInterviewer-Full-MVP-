const express = require('express');
const router = express.Router();
const coachFeedbackPrompt = require("../../ai/coach/coachFeedbackPrompt");

router.post('/', async (req, res) => {
  try {
    const { original_answer, retry_answer, question_text, session_id } = req.body;

    if (!original_answer || !retry_answer || !question_text) {
      return res.status(400).json({ error: "original_answer, retry_answer, and question_text are required." });
    }

    // Process evaluation for both attempts in parallel
    const [originalFeedback, retryFeedback] = await Promise.all([
      coachFeedbackPrompt({ answer_text: original_answer, question_text, session_id }),
      coachFeedbackPrompt({ answer_text: retry_answer, question_text, session_id })
    ]);

    // Safely extract scores falling back to 0 if nested improperly in AI layer return
    const originalScore = originalFeedback.overall_score || 0;
    const retryScore = retryFeedback.overall_score || 0;
    const score_delta = retryScore - originalScore;

    return res.json({
      score_delta,
      improvement: score_delta > 0,
      original_feedback: originalFeedback,
      retry_feedback: retryFeedback
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;