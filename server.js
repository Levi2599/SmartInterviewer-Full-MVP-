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

app.get("/", (req, res) => {
  res.json({
    app: "SmartInterviewer AI",
    status: "running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// ─── Routes ──────────────────────────────────────────────────
app.use("/api/auth", authController);

app.use("/api/simulator/generate-question", authenticate, questionGenerator);
app.use("/api/simulator/parse-file", authenticate, fileParserService);

app.use("/api/coach/analyze", authenticate, coachEngine);
app.use("/api/coach/retry", authenticate, retryHandler);

app.use("/api/questionBank/generate", authenticate, bankService);
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