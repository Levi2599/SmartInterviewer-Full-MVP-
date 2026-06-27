const express = require('express');
const router = express.Router();
const coachFeedbackPrompt = require("../../ai/coach/coachFeedbackPrompt");
const { findBySessionId } = require("../../database/simulator/sessionDB");
const { ProgressModel } = require("../../database/progress/progressDB");
const { detectWeaknesses } = require("../progress/weaknessDetector");

router.post('/', async (req, res) => {
  try {
    const { original_answer, retry_answer, question_text, expected_method, session_id, original_score, language: clientLang } = req.body;

    if (!original_answer || !retry_answer || !question_text) {
      return res.status(400).json({ error: "original_answer, retry_answer, and question_text are required." });
    }

    const method = expected_method || "STAR";

    const heChars = (retry_answer.match(/[֐-׿]/g) || []).length;
    const totalChars = retry_answer.replace(/\s/g, '').length;
    const language = clientLang || (totalChars > 0 && heChars / totalChars > 0.2 ? 'he' : 'en');

    // Evaluate only the retry answer — original score comes from the client
    // to prevent non-deterministic re-evaluation causing score inconsistency
    const retryFeedback = await coachFeedbackPrompt({
      answer_text: retry_answer,
      question_text,
      session_id,
      previous_feedback_history: [],
      expected_method: method,
      language
    });

    const originalScoreVal = typeof original_score === 'number' ? original_score : 0;
    const retryScore = retryFeedback.overall_score || 0;
    const score_delta = retryScore - originalScoreVal;

    // Save improved retry result to database only when score improved
    if (session_id && score_delta > 0) {
      const existingSession = await findBySessionId(session_id);
      if (existingSession) {
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
          const userId = existingSession.user_id || session_id.split('-').slice(0, -1).join('-');
          const weaknessEvaluation = await detectWeaknesses([retryFeedback.star_breakdown], language);
          const s = retryFeedback.star_breakdown.S || 0;
          const t = retryFeedback.star_breakdown.T || 0;
          const a = retryFeedback.star_breakdown.A || 0;
          const r = retryFeedback.star_breakdown.R || 0;
          const isCAR = retryFeedback.framework_detected === 'CAR';
          const readiness_score = isCAR
            ? Math.max(0, Math.min(100, Math.round((s + a + r) / 3)))
            : Math.max(0, Math.min(100, Math.round((s + t + a + r) / 4)));

          await ProgressModel.findOneAndUpdate(
            { user_id: userId, session_id },
            { $set: { readiness_score, star_breakdown: { S: s, T: t, A: a, R: r }, weakness_tags: weaknessEvaluation.weakness_profile || [] } },
            { sort: { date: -1 } }
          );
        }
      }
    }

    return res.json({
      score_delta,
      improvement: score_delta > 0,
      original_score: originalScoreVal,
      retry_feedback: retryFeedback
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
