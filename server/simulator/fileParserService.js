const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Use memory storage so files are not persisted to disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.txt') || file.originalname.endsWith('.docx') || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.'));
    }
  },
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { mimetype, originalname, buffer } = req.file;
    let text = '';

    if (mimetype === 'text/plain' || originalname.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
      const result = await pdfParse(buffer);
      text = result.text;
    } else {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }

    if (!text || !text.trim()) {
      return res.status(422).json({ error: 'Could not extract text from the uploaded file. Please try pasting text directly.' });
    }

    return res.json({ text: text.trim() });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'File parsing failed.' });
  }
});

module.exports = router;
