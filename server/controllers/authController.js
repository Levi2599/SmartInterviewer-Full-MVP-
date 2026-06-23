const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || null;

const { SessionModel } = require('../../database/simulator/sessionDB');
const { ProgressModel } = require('../../database/progress/progressDB');

async function cleanOldGuestData() {
  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oldSessions = await SessionModel.find({
      user_id: /^guest-/,
      created_at: { $lt: cutoff }
    }).select('user_id').lean();

    if (oldSessions.length === 0) return;

    const guestIds = [...new Set(oldSessions.map(s => s.user_id))];
    await SessionModel.deleteMany({ user_id: { $in: guestIds }, created_at: { $lt: cutoff } });
    await ProgressModel.deleteMany({ user_id: { $in: guestIds } });
    console.log(`Cleaned up ${guestIds.length} expired guest user(s).`);
  } catch (err) {
    console.error('Guest cleanup failed (non-critical):', err.message);
  }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: "Username is required." });
  }

  if (DEMO_PASSWORD && password && password !== DEMO_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const selectedRole = role || 'candidate';
  const userId = `user-${crypto.createHash('sha256').update(username.trim().toLowerCase()).digest('hex').slice(0, 12)}`;
  const token = jwt.sign({ userId, username: username.trim(), role: selectedRole }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({ token, userId, username: username.trim(), role: selectedRole });
});

// POST /api/auth/guest
router.post('/guest', (req, res) => {
  const { role } = req.body;
  const selectedRole = role || 'candidate';
  const guestId = `guest-${uuidv4().slice(0, 8)}`;
  const token = jwt.sign({ userId: guestId, username: 'Guest', role: selectedRole }, JWT_SECRET, { expiresIn: '30d' });

  cleanOldGuestData().catch(() => {});

  return res.json({ token, userId: guestId, username: 'Guest', role: selectedRole });
});

module.exports = router;
