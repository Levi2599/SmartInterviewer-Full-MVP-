const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  // Purposefully stubbed route for MVP compliance without breaking router mounting
  return res.status(501).json({ 
    error: "Transcription is not available in this MVP" 
  });
});

module.exports = router;