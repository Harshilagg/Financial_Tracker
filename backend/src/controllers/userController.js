const pool = require('../config/db');
const { convertToBase } = require('../utils/currency');

// Update user's primary currency and recalculate derived base amounts
exports.updatePrimaryCurrency = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { primary_currency } = req.body;

    if (!primary_currency || !['INR','USD','EUR'].includes(primary_currency)) {
      return res.status(400).json({ error: 'Invalid primary_currency. Supported: INR, USD, EUR' });
    }

    await client.query('BEGIN');

    // update user
    const ures = await client.query(
      `UPDATE users SET primary_currency = $1 WHERE id = $2 RETURNING id, name, email, primary_currency`,
      [primary_currency, userId]
    );

    if (!ures.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    // fetch all transactions for user
    const tres = await client.query(
      `SELECT id, amount, currency, transaction_date, category_id, type
       FROM transactions WHERE user_id = $1`,
      [userId]
    );

    // update each transaction's base_amount, base_currency and exchange_rate
    for (const t of tres.rows) {
      const fromCurrency = t.currency || 'INR';
      const { exchange_rate, base_amount } = await convertToBase(t.amount, fromCurrency, primary_currency);
      await client.query(
        `UPDATE transactions SET base_amount = $1, base_currency = $2, exchange_rate = $3 WHERE id = $4`,
        [base_amount, primary_currency, exchange_rate, t.id]
      );
    }

    // Rebuild monthly_category_spend for this user from transactions
    await client.query(`DELETE FROM monthly_category_spend WHERE user_id = $1`, [userId]);

    await client.query(
      `INSERT INTO monthly_category_spend (user_id, category_id, month, year, base_spent)
       SELECT user_id, category_id, EXTRACT(MONTH FROM transaction_date)::INT AS month, EXTRACT(YEAR FROM transaction_date)::INT AS year, SUM(base_amount) AS base_spent
       FROM transactions
       WHERE user_id = $1
       GROUP BY user_id, category_id, month, year`,
      [userId]
    );

    // Rebuild monthly_user_summary for this user
    await client.query(`DELETE FROM monthly_user_summary WHERE user_id = $1`, [userId]);

    await client.query(
      `INSERT INTO monthly_user_summary (user_id, month, year, total_income, total_expense)
       SELECT user_id, EXTRACT(MONTH FROM transaction_date)::INT AS month, EXTRACT(YEAR FROM transaction_date)::INT AS year,
         COALESCE(SUM(CASE WHEN type='income' THEN base_amount ELSE 0 END),0) AS total_income,
         COALESCE(SUM(CASE WHEN type='expense' THEN base_amount ELSE 0 END),0) AS total_expense
       FROM transactions
       WHERE user_id = $1
       GROUP BY user_id, month, year`,
      [userId]
    );

    // Recalculate budgets' base_amount/exchange_rate based on budget.amount and budget.currency
    const bres = await client.query(`SELECT id, amount, currency FROM budgets WHERE user_id = $1`, [userId]);
    for (const b of bres.rows) {
      const fromCurrency = b.currency || 'INR';
      const { exchange_rate, base_amount } = await convertToBase(b.amount, fromCurrency, primary_currency);
      await client.query(
        `UPDATE budgets SET base_amount = $1, base_currency = $2, exchange_rate = $3 WHERE id = $4`,
        [base_amount, primary_currency, exchange_rate, b.id]
      );
    }

    await client.query('COMMIT');

    res.json(ures.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('updatePrimaryCurrency error', err.message || err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};
