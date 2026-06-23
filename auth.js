// auth.js
const jwt = require("jsonwebtoken");
const config = require("./config");

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = user;
    next();
  });
}

module.exports = { authenticate };