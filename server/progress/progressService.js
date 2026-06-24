const express = require('express');
const router = express.Router();
const { detectWeaknesses } = require("./weaknessDetector");
const recommendationPrompt = require("../../ai/progress/recommendationPrompt");
const { saveProgress, findByUserId, getHistory, updateRecommendationCache } = require("../../database/progress/progressDB");

// POST /save
router.post('/save', async (req, res) => {
  try {
    const { user_id, session_id, star_scores } = req.body;

    if (!user_id || !star_scores) {
      return res.status(400).json({ error: "user_id and star_scores are required." });
    }

    // Capture standard array wrapping format for handling historical scores safely
    const scoringHistoryArray = Array.isArray(star_scores) ? star_scores : [star_scores];
    const weaknessEvaluation = await detectWeaknesses(scoringHistoryArray);

    const lastScore = scoringHistoryArray[scoringHistoryArray.length - 1] || {};
    const s = Number(lastScore.S ?? lastScore.situation ?? 0);
    const t = Number(lastScore.T ?? lastScore.task ?? 0);
    const a = Number(lastScore.A ?? lastScore.action ?? 0);
    const r = Number(lastScore.R ?? lastScore.result ?? 0);
    const readiness_score = Math.max(0, Math.min(100, Math.round((s + t + a + r) / 4)));

    const targetPayload = {
      user_id,
      session_id,
      readiness_score,
      star_breakdown: { S: s, T: t, A: a, R: r },
      weakness_tags: weaknessEvaluation.weakness_profile || []
    };

    const savedResult = await saveProgress(targetPayload);
    return res.json(savedResult);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// DELETE /:userId - GDPR deletion of all progress and session records
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { SessionModel } = require("../../database/simulator/sessionDB");
    const { ProgressModel } = require("../../database/progress/progressDB");

    await ProgressModel.deleteMany({ user_id: userId });
    await SessionModel.deleteMany({ user_id: userId });

    return res.json({ success: true, message: `All data for user ${userId} has been successfully deleted.` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Use getHistory directly to avoid single-record findByUserId crash on forEach
    const history = await getHistory(userId) || [];

    if (history.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    // Accumulate total metrics to assemble a global breakdown overview profile
    const star_breakdown = { S: 0, T: 0, A: 0, R: 0 };
    let recordCount = 0;
    const aggregateStarScores = [];

    history.forEach(record => {
      const breakdown = record.star_breakdown;
      if (breakdown) {
        const s = breakdown.S ?? 0;
        const t = breakdown.T ?? 0;
        const a = breakdown.A ?? 0;
        const r = breakdown.R ?? 0;
        
        star_breakdown.S += s;
        star_breakdown.T += t;
        star_breakdown.A += a;
        star_breakdown.R += r;
        recordCount++;
        aggregateStarScores.push({ S: s, T: t, A: a, R: r });
      }
    });

    if (recordCount > 0) {
      star_breakdown.S = parseFloat((star_breakdown.S / recordCount).toFixed(2));
      star_breakdown.T = parseFloat((star_breakdown.T / recordCount).toFixed(2));
      star_breakdown.A = parseFloat((star_breakdown.A / recordCount).toFixed(2));
      star_breakdown.R = parseFloat((star_breakdown.R / recordCount).toFixed(2));
    }

    const { weakness_profile, lowest_component } = await detectWeaknesses(aggregateStarScores);

    const clean_history = history.map(h => ({
      date: h.date,
      readiness_score: h.readiness_score,
      star_breakdown: h.star_breakdown,
      weakness_tags: h.weakness_tags
    }));

    const calculated_readiness = recordCount > 0
      ? Math.max(0, Math.min(100, Math.round(history.reduce((sum, h) => sum + (h.readiness_score || 0), 0) / recordCount)))
      : 0;

    const latestRecord = history[history.length - 1];
    const existingCache = latestRecord?.recommendation_cache;
    const cacheIsValid = existingCache &&
      existingCache.generated_at &&
      existingCache.session_count_at_generation === recordCount;

    let weaknessPattern, focusArea, actionableSteps;

    if (cacheIsValid) {
      weaknessPattern = existingCache.detected_weakness_pattern || `Growth needed in ${lowest_component}.`;
      focusArea = existingCache.focus_area || lowest_component;
      actionableSteps = existingCache.actionable_steps || ["Practice structuring responses."];
    } else {
      try {
        const aiRecommendation = await recommendationPrompt({
          star_breakdown,
          weakness_profile,
          lowest_component,
          session_count: recordCount,
          session_history: clean_history
        });

        weaknessPattern = aiRecommendation.detected_weakness_pattern || `Growth needed in ${lowest_component}.`;
        focusArea = (aiRecommendation.strategic_recommendation && aiRecommendation.strategic_recommendation.focus_area) || lowest_component;
        actionableSteps = (aiRecommendation.strategic_recommendation && aiRecommendation.strategic_recommendation.actionable_steps) || ["Practice structuring responses."];

        updateRecommendationCache(userId, {
          detected_weakness_pattern: weaknessPattern,
          focus_area: focusArea,
          actionable_steps: actionableSteps,
          generated_at: new Date(),
          session_count_at_generation: recordCount
        }).catch(err => console.error('Cache update failed (non-critical):', err));
      } catch (aiErr) {
        console.error('AI recommendation failed (non-critical):', aiErr.message);
        weaknessPattern = `Focus on strengthening your ${lowest_component} component.`;
        focusArea = lowest_component;
        actionableSteps = [
          "Practice structuring responses with the STAR method.",
          "Add specific, measurable results to your answers.",
          "Keep answers concise — aim for 90–120 seconds per response."
        ];
      }
    }

    return res.json({
      user_id: userId,
      session_history: clean_history,
      star_breakdown,
      weakness_profile: [weaknessPattern], // Ensure array wrapper to prevent frontend map crash
      training_plan: actionableSteps,
      priority_focus: focusArea,
      readiness_score: calculated_readiness
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;