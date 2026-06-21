const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_change_me";

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: "Username is required." });
  }

  const selectedRole = role || 'candidate';
  const userId = `user-${username.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const token = jwt.sign({ userId, username: username.trim(), role: selectedRole }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({ token, userId, username: username.trim(), role: selectedRole });
});

// POST /api/auth/guest
router.post('/guest', (req, res) => {
  const { role } = req.body;
  const selectedRole = role || 'candidate';
  const guestId = `guest-${uuidv4().slice(0, 8)}`;
  const token = jwt.sign({ userId: guestId, username: 'Guest', role: selectedRole }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({ token, userId: guestId, username: 'Guest', role: selectedRole });
});

module.exports = router;
