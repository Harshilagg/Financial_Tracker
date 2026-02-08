const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const oauthController = require("../controllers/oauthController");

const authMiddleware = require("../middleware/authMiddleware");

// PUBLIC ROUTES
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get('/google', oauthController.googleStart);
router.get('/google/callback', oauthController.googleCallback);

// PROTECTED ROUTE
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Profile accessed successfully",
    userId: req.user.id
  });
});

module.exports = router;
