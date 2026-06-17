// auth.js
const jwt = require("jsonwebtoken");
const config = require("./config");

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Expecting JWT_SECRET to be defined in your environment
  const secret = process.env.JWT_SECRET || "fallback_secret_change_me";

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticate };