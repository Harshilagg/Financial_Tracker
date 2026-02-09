const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const receiptController = require('../controllers/receiptController');

router.get('/:id/url', authMiddleware, receiptController.getReceiptUrl);

module.exports = router;
