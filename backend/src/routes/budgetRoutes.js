const express = require("express");
const router = express.Router();

const budgetController = require("../controllers/budgetController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, budgetController.createBudget);
router.get("/", authMiddleware, budgetController.getBudgets);
router.put("/:id", authMiddleware, budgetController.updateBudget);
router.delete("/:id", authMiddleware, budgetController.deleteBudget);

module.exports = router;
