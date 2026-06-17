const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const questionGenPrompt = require("../../ai/questionBank/questionGenPrompt");
const { saveQuestionSet } = require("../../database/questionBank/questionBankDB");

router.post('/', async (req, res) => {
  try {
    const { job_role, industry, seniority_level, jd_text, question_count } = req.body;

    if (!job_role || !industry || !seniority_level) {
      return res.status(400).json({ error: "job_role, industry, and seniority_level are required fields." });
    }

    const aiQuestions = await questionGenPrompt({
      job_role,
      industry,
      seniority_level,
      jd_text: jd_text || "",
      question_count: question_count || 5
    });

    const question_bank_id = uuidv4();

    const recordToSave = {
      question_bank_id,
      job_role,
      industry,
      seniority_level,
      questions: aiQuestions,
      created_at: new Date()
    };

    await saveQuestionSet(recordToSave);

    return res.json({
      question_bank_id,
      questions: aiQuestions
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;