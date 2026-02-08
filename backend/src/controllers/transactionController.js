const pool = require("../config/db");
const { convertToBase } = require("../utils/currency");
const { updateMonthlySpend, updateMonthlySummary } = require("../utils/monthlySpend");

/*
CREATE TRANSACTION
*/
exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      category_id,
      type,
      amount,
      currency,
      description,
      transaction_date,
      is_refund
    } = req.body;

    if (!category_id || !type || !amount || !transaction_date) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    // Validate category ownership
    const categoryCheck = await pool.query(
      `SELECT * FROM categories
       WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
      [category_id, userId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid category"
      });
    }

    // Validate category type matches transaction type
    if (categoryCheck.rows[0].type !== type) {
      return res.status(400).json({
        error: "Transaction type mismatch with category"
      });
    }

    const userCurrencyResult = await pool.query(
      `SELECT primary_currency FROM users WHERE id = $1`,
      [userId]
    );

    const baseCurrency =
      userCurrencyResult.rows[0]?.primary_currency || "INR";

      const { exchange_rate, base_amount } =
      await convertToBase(amount, currency || "USD", baseCurrency);


    const result = await pool.query(
  `INSERT INTO transactions
   (user_id, category_id, type, amount, currency,
    description, transaction_date, is_refund,
    base_currency, exchange_rate, base_amount)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
   RETURNING *`,
  [
    userId,
    category_id,
    type,
    amount,
    currency || "USD",
    description,
    transaction_date,
    is_refund || false,
    baseCurrency,
    exchange_rate,
    base_amount
  ]
);

    // update monthly summaries (category and user-level)
    try {
      await updateMonthlySpend({
        user_id: userId,
        category_id,
        transaction_date,
        base_amount
      });

      await updateMonthlySummary({
        user_id: userId,
        transaction_date,
        base_amount,
        type
      });
    } catch (e) {
      console.error("Failed updating monthly summaries:", e.message || e);
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


/*
GET USER TRANSACTIONS
*/
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT t.*, c.name as category_name
       FROM transactions t
       LEFT JOIN categories c
       ON t.category_id = c.id
       WHERE t.user_id = $1
       ORDER BY transaction_date DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


/*
UPDATE TRANSACTION
*/
exports.updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const {
      category_id,
      amount,
      currency,
      description,
      transaction_date
    } = req.body;

    // get user's primary currency
    const userCurrencyResult = await pool.query(
      `SELECT primary_currency FROM users WHERE id = $1`,
      [userId]
    );

    const baseCurrency =
      userCurrencyResult.rows[0]?.primary_currency || "INR";

    // recompute conversion
    const { exchange_rate, base_amount } =
      await convertToBase(amount, currency, baseCurrency);

    const result = await pool.query(
      `UPDATE transactions
       SET category_id = $1,
           amount = $2,
           currency = $3,
           exchange_rate = $4,
           base_amount = $5,
           description = $6,
           transaction_date = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        category_id,
        amount,
        currency,
        exchange_rate,
        base_amount,
        description,
        transaction_date,
        id,
        userId
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


/*
DELETE TRANSACTION
*/
exports.deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      `DELETE FROM transactions
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ message: "Transaction deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
