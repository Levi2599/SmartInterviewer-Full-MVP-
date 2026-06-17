const express = require('express');
const router = express.Router();
const { findById } = require("../../database/questionBank/questionBankDB");

router.get('/:id', async (req, res) => {
  try {
    const questionBankId = req.params.id;
    const questionBank = await findById(questionBankId);

    if (!questionBank) {
      return res.status(404).json({ error: "Not found" });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="interview-guide.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.json(questionBank);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;