const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Authorization: Bearer TOKEN
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // attach user info to request
    req.user = decoded;

    next(); // move to next handler

  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token"
    });
  }
};

module.exports = authMiddleware;
