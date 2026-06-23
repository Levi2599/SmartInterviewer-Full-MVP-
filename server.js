const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const config = require("./config.js");
const { connectDB } = require("./database/db.js");

const questionGenerator = require("./server/simulator/questionGenerator");
const fileParserService = require("./server/simulator/fileParserService");

const coachEngine = require("./server/coach/coachEngine");
const retryHandler = require("./server/coach/retryHandler");

const bankService = require("./server/questionBank/bankService");
const guideExporter = require("./server/questionBank/guideExporter");

const progressService = require("./server/progress/progressService");

const authController = require("./server/controllers/authController");
const { authenticate } = require("./auth.js");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ─── Simple In-Memory Rate Limiter ───────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
  }
  return next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.start > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

app.get("/", (req, res) => {
  res.json({
    app: "SmartInterviewer AI",
    status: "running",
  });
});

// The /health route below is used by UptimeRobot to keep the Render server warm.
// Configure UptimeRobot (uptimerobot.com) to ping this URL every 5 minutes:
// https://<your-render-app>.onrender.com/health
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authController);

app.use("/api/simulator/generate-question", rateLimiter, authenticate, questionGenerator);
app.use("/api/simulator/parse-file", authenticate, fileParserService);

app.use("/api/coach/analyze", rateLimiter, authenticate, coachEngine);
app.use("/api/coach/retry", rateLimiter, authenticate, retryHandler);

app.use("/api/questionBank/generate", rateLimiter);
app.use("/api/questionBank", authenticate, bankService);
app.use("/api/questionBank/export", authenticate, guideExporter);

app.use("/api/progress", authenticate, progressService);

// ─── Start Server ─────────────────────────────────────────────
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(config.PORT, () => {
        console.log(`Server running on port ${config.PORT}`);
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error.message);
      process.exit(1);
    });
}

module.exports = app;