// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Base Health Check Route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", project: "smartinterviewer" });
});

// Start server only if not running in a test environment
if (process.env.NODE_ENV !== "test") {
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
}

module.exports = app;