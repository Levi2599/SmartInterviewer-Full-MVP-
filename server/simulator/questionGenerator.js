const express = require('express');
const router = express.Router();
const interviewProfilePrompt = require("../../ai/simulator/interviewProfilePrompt");
const { saveSession } = require("../../database/simulator/sessionDB");

function detectLanguage(text) {
  const heChars = (text.match(/[֐-׿]/g) || []).length;
  const total = text.replace(/\s/g, '').length;
  return total > 0 && heChars / total > 0.25 ? 'he' : 'en';
}

// ─── Server-side session cache ────────────────────────────────────────────────
// Stores { cv_text, jd_text, language } per session_id.
// Avoids re-sending heavy context payloads on every turn.
// Entries expire automatically after 2 hours.
const SESSION_CACHE = new Map();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function setCacheEntry(sessionId, cv_text, jd_text, language) {
  SESSION_CACHE.set(sessionId, { cv_text, jd_text, language, ts: Date.now() });
}

function getCacheEntry(sessionId) {
  const entry = SESSION_CACHE.get(sessionId);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    SESSION_CACHE.delete(sessionId);
    return null;
  }
  return entry;
}

function clearCacheEntry(sessionId) {
  SESSION_CACHE.delete(sessionId);
}
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    console.log("GENERATE QUESTION REQUEST BODY:", req.body);
    const { cv_text, jd_text, session_id, turn_number, conversation_history, language } = req.body;
    const resolvedTurn = (typeof turn_number === 'number' && turn_number > 0) ? turn_number : 1;

    // ── Resolve cv/jd from cache or from request body ──────────────────────
    let resolvedCv  = cv_text  || null;
    let resolvedJd  = jd_text  || null;
    let resolvedLang = null;

    if (resolvedTurn === 1 && resolvedCv && resolvedJd) {
      // First turn: seed the server-side cache with the heavy context
      resolvedLang = language || detectLanguage(resolvedJd + ' ' + resolvedCv);
      if (session_id) setCacheEntry(session_id, resolvedCv, resolvedJd, resolvedLang);
    } else if (session_id) {
      // Subsequent turns: retrieve from cache — no need for client to resend CV/JD
      const cached = getCacheEntry(session_id);
      if (cached) {
        resolvedCv   = cached.cv_text;
        resolvedJd   = cached.jd_text;
        resolvedLang = cached.language;
      }
    }

    if (!resolvedCv || !resolvedJd) {
      return res.status(400).json({
        error: "cv_text and jd_text are required for the first turn (or session not found in cache)."
      });
    }

    if (!resolvedLang) {
      resolvedLang = language || detectLanguage(resolvedJd + ' ' + resolvedCv);
    }
    // ───────────────────────────────────────────────────────────────────────

    // Call AI layer — only passes the resolved context (cv+jd cached server-side)
    const aiResponse = await interviewProfilePrompt({
      cv_text: resolvedCv,
      jd_text: resolvedJd,
      session_id,
      turn_number: resolvedTurn,
      conversation_history: conversation_history || [],
      language: resolvedLang
    });

    // Persist session to DB (only on turn 1 to avoid redundant writes)
    if (resolvedTurn === 1 && session_id) {
      const userId = session_id.split('-').slice(0, -1).join('-') || 'user-001';
      await saveSession({
        session_id,
        user_id: userId,
        cv_text: resolvedCv,
        jd_text: resolvedJd,
        transcript: []
      });
    }

    return res.json(aiResponse);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = { router, clearCacheEntry };