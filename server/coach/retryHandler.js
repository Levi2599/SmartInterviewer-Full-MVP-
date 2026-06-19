const express = require('express');
const router = express.Router();
const coachFeedbackPrompt = require("../../ai/coach/coachFeedbackPrompt");
const { findBySessionId } = require("../../database/simulator/sessionDB");
const { saveProgress } = require("../../database/progress/progressDB");
const { detectWeaknesses } = require("../progress/weaknessDetector");

router.post('/', async (req, res) => {
  try {
    const { original_answer, retry_answer, question_text, session_id } = req.body;

    if (!original_answer || !retry_answer || !question_text) {
      return res.status(400).json({ error: "original_answer, retry_answer, and question_text are required." });
    }

    // Process evaluation for both attempts in parallel
    const [originalFeedback, retryFeedback] = await Promise.all([
      coachFeedbackPrompt({ answer_text: original_answer, question_text, session_id, previous_feedback_history: [] }),
      coachFeedbackPrompt({ answer_text: retry_answer, question_text, session_id, previous_feedback_history: [] })
    ]);

    // Safely extract scores falling back to 0 if nested improperly in AI layer return
    const originalScore = originalFeedback.overall_score || 0;
    const retryScore = retryFeedback.overall_score || 0;
    const score_delta = retryScore - originalScore;

    // Save improved retry result to database
    if (session_id && score_delta > 0) {
      const existingSession = await findBySessionId(session_id);
      if (existingSession) {
        // Replace or append candidate retry answer
        const origStr = `candidate: ${original_answer}`;
        const index = existingSession.transcript.indexOf(origStr);
        if (index !== -1) {
          existingSession.transcript[index] = `candidate (retry): ${retry_answer}`;
        } else {
          existingSession.transcript.push(`candidate (retry): ${retry_answer}`);
        }

        if (retryFeedback.star_breakdown) {
          existingSession.star_scores = {
            S: retryFeedback.star_breakdown.S || 0,
            T: retryFeedback.star_breakdown.T || 0,
            A: retryFeedback.star_breakdown.A || 0,
            R: retryFeedback.star_breakdown.R || 0
          };
        }

        if (retryFeedback.improvement_tip) {
          if (!existingSession.feedback_history) {
            existingSession.feedback_history = [];
          }
          existingSession.feedback_history.push(retryFeedback.improvement_tip);
        }

        await existingSession.save();

        if (retryFeedback.star_breakdown) {
          const userId = existingSession.user_id || session_id.split('-').slice(0, 2).join('-');
          const weaknessEvaluation = await detectWeaknesses([retryFeedback.star_breakdown]);
          const s = retryFeedback.star_breakdown.S || 0;
          const t = retryFeedback.star_breakdown.T || 0;
          const a = retryFeedback.star_breakdown.A || 0;
          const r = retryFeedback.star_breakdown.R || 0;
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
    }

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