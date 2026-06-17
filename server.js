const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const config = require("./config.js");
const { connectDB } = require("./database/db.js");

const questionGenerator = require("./server/simulator/questionGenerator");
const transcriptionService = require("./server/simulator/transcriptionService");

const coachEngine = require("./server/coach/coachEngine");
const retryHandler = require("./server/coach/retryHandler");

const bankService = require("./server/questionBank/bankService");
const guideExporter = require("./server/questionBank/guideExporter");

const progressService = require("./server/progress/progressService");

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
app.use("/api/simulator/generate-question", questionGenerator);
app.use("/api/simulator/transcribe", transcriptionService);

app.use("/api/coach/analyze", coachEngine);
app.use("/api/coach/retry", retryHandler);

app.use("/api/questionBank/generate", bankService);
app.use("/api/questionBank/export", guideExporter);

app.use("/api/progress", progressService);

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