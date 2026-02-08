const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transactionController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const upload = multer();
const storageService = require('../services/storageService');
const pool = require('../config/db');

router.post("/", authMiddleware, transactionController.createTransaction);
router.get("/", authMiddleware, transactionController.getTransactions);
router.put("/:id", authMiddleware, transactionController.updateTransaction);
router.delete("/:id", authMiddleware, transactionController.deleteTransaction);

// upload receipt for a transaction
router.post('/:id/receipts', authMiddleware, upload.single('receipt'), async (req, res) => {
	try {
		const userId = req.user.id;
		const { id } = req.params;
		// verify transaction belongs to user
		const tx = await pool.query('SELECT * FROM transactions WHERE id=$1 AND user_id=$2', [id, userId]);
		if (!tx.rows.length) return res.status(404).json({ error: 'Transaction not found' });
		if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

		const key = `receipts/${userId}/${Date.now()}_${req.file.originalname}`;
		const url = await storageService.uploadBuffer(req.file.buffer, key, req.file.mimetype);

		const insert = await pool.query(
			`INSERT INTO receipts(transaction_id, user_id, filename, storage_url)
			 VALUES($1,$2,$3,$4) RETURNING *`,
			[id, userId, req.file.originalname, url]
		);

		res.json(insert.rows[0]);
	} catch (e) {
		console.error('Receipt upload error', e.message || e);
		res.status(500).json({ error: 'Upload failed' });
	}
});

module.exports = router;
