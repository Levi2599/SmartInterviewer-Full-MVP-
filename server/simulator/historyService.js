const express = require('express');
const router = express.Router();
const { SessionModel } = require('../../database/simulator/sessionDB');

// Helper to extract a clean job title from JD text
function extractJobTitle(jdText, defaultRole = 'General Practice') {
  if (!jdText || !jdText.trim()) return defaultRole;
  
  const lines = jdText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return defaultRole;

  // Look for lines containing "title", "role", "position" (case-insensitive)
  const titleRegex = /(?:job\s+)?(?:title|role|position):\s*(.+)/i;
  for (const line of lines) {
    const match = line.match(titleRegex);
    if (match && match[1] && match[1].trim().length < 60) {
      return match[1].trim();
    }
  }

  // Fallback to the first line if it's short
  if (lines[0].length < 60) {
    return lines[0];
  }

  // Fallback to a trimmed slice
  const slice = jdText.slice(0, 45).trim();
  return slice + (jdText.length > 45 ? '...' : '');
}

// GET /api/simulator/history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await SessionModel.find({ user_id: userId })
      .sort({ created_at: -1 })
      .lean();

    const uniqueHistory = [];
    const seenJds = new Set();

    for (const session of sessions) {
      if (!session.jd_text || !session.jd_text.trim()) continue;
      
      // Normalize JD to detect duplicates
      const normalizedJd = session.jd_text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 300); // Compare first 300 normalized characters

      if (!seenJds.has(normalizedJd)) {
        seenJds.add(normalizedJd);
        
        // Extract a nice title
        const title = extractJobTitle(session.jd_text, 'General Job');
        
        uniqueHistory.push({
          session_id: session.session_id,
          title,
          cv_text: session.cv_text || '',
          jd_text: session.jd_text || '',
          created_at: session.created_at
        });
      }
    }

    return res.json(uniqueHistory);
  } catch (err) {
    console.error('History fetch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/simulator/last-active
router.get('/last-active', async (req, res) => {
  try {
    const userId = req.user.userId;
    const lastSession = await SessionModel.findOne({ user_id: userId })
      .sort({ created_at: -1 })
      .lean();

    if (!lastSession) {
      return res.json({ cv_text: '', jd_text: '' });
    }

    return res.json({
      cv_text: lastSession.cv_text || '',
      jd_text: lastSession.jd_text || ''
    });
  } catch (err) {
    console.error('Last active fetch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
