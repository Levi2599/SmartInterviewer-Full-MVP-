const express = require('express');
const router = express.Router();
const { detectWeaknesses } = require("./weaknessDetector");
const recommendationPrompt = require("../../ai/progress/recommendationPrompt");
const { saveProgress, findByUserId, getHistory } = require("../../database/progress/progressDB");

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

    // Call AI Engine layer for programmatic synthesis reports
    const aiRecommendation = await recommendationPrompt({
      star_breakdown,
      weakness_profile,
      lowest_component,
      session_count: recordCount
    });

    return res.json({
      user_id: userId,
      session_history: history,
      star_breakdown,
      weakness_profile,
      training_plan: aiRecommendation.training_plan || ["Focus on building structured frameworks."],
      priority_focus: aiRecommendation.priority_focus || lowest_component,
      readiness_score: aiRecommendation.readiness_score || 70
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;