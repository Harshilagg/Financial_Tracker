const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer();
const importController = require('../controllers/importController');

router.post('/statements', authMiddleware, upload.single('statement'), importController.importStatement);

module.exports = router;
