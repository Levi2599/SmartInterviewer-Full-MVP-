const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
}

const { UserModel } = require('../../database/users/userDB');
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

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !username.trim()) return res.status(400).json({ error: 'Username is required.' });
  if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required.' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return res.status(400).json({ error: 'Invalid email address.' });

  try {
    const existingUsername = await UserModel.findOne({ username: username.trim() });
    if (existingUsername) return res.status(409).json({ error: 'Username already taken.' });

    const existingEmail = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) return res.status(409).json({ error: 'Email already registered.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const selectedRole = role || 'candidate';

    const user = await UserModel.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: selectedRole,
    });

    const userId = `user-${user._id.toString()}`;
    const token = jwt.sign({ userId, username: user.username, role: selectedRole }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(201).json({ token, userId, username: user.username, role: selectedRole });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !identifier.trim()) return res.status(400).json({ error: 'Username or email is required.' });
  if (!password) return res.status(400).json({ error: 'Password is required.' });

  try {
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await UserModel.findOne({ email: identifier.trim().toLowerCase() })
      : await UserModel.findOne({ username: identifier.trim() });

    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const userId = `user-${user._id.toString()}`;
    const token = jwt.sign({ userId, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({ token, userId, username: user.username, role: user.role });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
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
