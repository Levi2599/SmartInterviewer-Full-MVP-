const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const questionGenPrompt = require("../../ai/questionBank/questionGenPrompt");
const { saveQuestionSet } = require("../../database/questionBank/questionBankDB");

router.post('/generate', async (req, res) => {
  try {
    const { job_role, industry, seniority_level, jd_text, question_count, language } = req.body;

    if (!job_role || !industry || !seniority_level) {
      return res.status(400).json({ error: "job_role, industry, and seniority_level are required fields." });
    }

    const aiQuestions = await questionGenPrompt({
      job_role,
      industry,
      seniority_level,
      jd_text: jd_text || "",
      question_count: question_count || 5,
      language: language || 'en'
    });

    const question_bank_id = uuidv4();

    const recordToSave = {
      question_id: question_bank_id,
      job_role,
      industry,
      seniority_level,
      jd_text: jd_text || "",
      questions_array: aiQuestions,
      created_by: req.user.userId,
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

// GET /api/questionBank
router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const { QuestionBankModel } = require("../../database/questionBank/questionBankDB");
    const records = await QuestionBankModel.find({ created_by: req.user.userId }).sort({ created_at: -1 }).exec();
    return res.json(records);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// DELETE /api/questionBank/:id
router.delete('/:id', async (req, res) => {
  try {
    const { QuestionBankModel } = require("../../database/questionBank/questionBankDB");
    const result = await QuestionBankModel.deleteOne({ question_id: req.params.id }).exec();
    return res.json({ success: true, deletedCount: result.deletedCount });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;