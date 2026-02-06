const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// PUBLIC ROUTES
router.post("/register", authController.register);
router.post("/login", authController.login);

// PROTECTED ROUTE
router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Profile accessed successfully",
    userId: req.user.id
  });
});

module.exports = router;
