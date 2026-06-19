const express = require('express');
const router = express.Router();
const coachFeedbackPrompt = require("../../ai/coach/coachFeedbackPrompt");
const { findBySessionId } = require("../../database/simulator/sessionDB");
const { saveProgress } = require("../../database/progress/progressDB");
const { detectWeaknesses } = require("../progress/weaknessDetector");

router.post('/', async (req, res) => {
  const start = Date.now();
  try {
    const { answer_text, question_text, star_target, topic_tag, session_id } = req.body;

    if (!answer_text || !question_text) {
      return res.status(400).json({ error: "answer_text and question_text are required." });
    }

    let previous_feedback_history = [];
    let existingSession = null;
    if (session_id) {
      existingSession = await findBySessionId(session_id);
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

    // Automatically update session and save progress record
    if (existingSession) {
      existingSession.transcript.push(`interviewer: ${question_text}`);
      existingSession.transcript.push(`candidate: ${answer_text}`);

      if (feedbackResult.star_breakdown) {
        existingSession.star_scores = {
          S: feedbackResult.star_breakdown.S || 0,
          T: feedbackResult.star_breakdown.T || 0,
          A: feedbackResult.star_breakdown.A || 0,
          R: feedbackResult.star_breakdown.R || 0
        };
      }

      if (feedbackResult.improvement_tip) {
        if (!existingSession.feedback_history) {
          existingSession.feedback_history = [];
        }
        existingSession.feedback_history.push(feedbackResult.improvement_tip);
      }

      await existingSession.save();

      if (feedbackResult.star_breakdown) {
        const userId = existingSession.user_id || session_id.split('-').slice(0, 2).join('-');
        const weaknessEvaluation = await detectWeaknesses([feedbackResult.star_breakdown]);
        const s = feedbackResult.star_breakdown.S || 0;
        const t = feedbackResult.star_breakdown.T || 0;
        const a = feedbackResult.star_breakdown.A || 0;
        const r = feedbackResult.star_breakdown.R || 0;
        const readiness_score = Math.max(0, Math.min(100, Math.round((s + t + a + r) / 4)));

        await saveProgress({
          user_id: userId,
          session_id,
          readiness_score,
          star_breakdown: { S: s, T: t, A: a, R: r },
          weakness_tags: weaknessEvaluation.weakness_profile || []
        });
      }
    }

    console.log(`Coach latency: ${Date.now() - start}ms`);
    return res.json(feedbackResult);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;