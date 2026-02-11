const pool = require('../config/db');

// Update user's primary currency
exports.updatePrimaryCurrency = async (req, res) => {
  try {
    const userId = req.user.id;
    const { primary_currency } = req.body;

    if (!primary_currency || !['INR','USD','EUR'].includes(primary_currency)) {
      return res.status(400).json({ error: 'Invalid primary_currency. Supported: INR, USD, EUR' });
    }

    const result = await pool.query(
      `UPDATE users SET primary_currency = $1 WHERE id = $2 RETURNING id, name, email, primary_currency`,
      [primary_currency, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updatePrimaryCurrency error', err.message || err);
    res.status(500).json({ error: 'Server error' });
  }
};
