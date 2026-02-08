const pool = require("../config/db");
const { convertToBase } = require("../utils/currency");
/*
CREATE BUDGET
*/
exports.createBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_id, amount, currency, month, year } = req.body;

    if (!category_id || !amount || !month || !year) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    // validate category
    const categoryCheck = await pool.query(
      `SELECT * FROM categories
       WHERE id = $1 AND user_id = $2 AND type = 'expense'`,
      [category_id, userId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid expense category"
      });
    }

    // get user's primary currency
    const userCurrencyResult = await pool.query(
      `SELECT primary_currency FROM users WHERE id = $1`,
      [userId]
    );

    const baseCurrency =
      userCurrencyResult.rows[0]?.primary_currency || "INR";

    // convert budget to base currency
    const { exchange_rate, base_amount } =
      await convertToBase(amount, currency || "USD", baseCurrency);

    const insert = await pool.query(
      `INSERT INTO budgets
       (user_id, category_id, amount, currency, base_amount, base_currency, exchange_rate, month, year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, user_id, category_id, amount, currency, base_amount, base_currency, exchange_rate, month, year`,
      [userId, category_id, amount, currency, base_amount, baseCurrency, exchange_rate, month, year]
    );

    res.json(insert.rows[0]);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  };

/*
GET BUDGETS WITH PROGRESS
*/
exports.getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;

    // optional filters (month/year) to view budgets for specific months
    const month = req.query.month ? parseInt(req.query.month, 10) : null;
    const year = req.query.year ? parseInt(req.query.year, 10) : null;

    let params = [userId];
    let whereClause = `WHERE b.user_id = $1`;

    if (month && year) {
      params.push(month, year);
      whereClause = `WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3`;
    }

    const q = `
    SELECT
      b.id,
      c.name AS category,
      b.amount AS budget_amount,
      b.currency,
      b.base_amount,
      b.base_currency,
      b.month,
      b.year,

      COALESCE(SUM(t.base_amount),0) AS spent,

      (b.base_amount - COALESCE(SUM(t.base_amount),0)) AS remaining

    FROM budgets b
    JOIN categories c ON b.category_id = c.id

    LEFT JOIN transactions t
      ON t.category_id = b.category_id
      AND t.user_id = b.user_id
      AND EXTRACT(MONTH FROM t.transaction_date)::INT = b.month
      AND EXTRACT(YEAR FROM t.transaction_date)::INT = b.year

    ${whereClause}

    GROUP BY
      b.id,
      c.name,
      b.amount,
      b.currency,
      b.base_amount,
      b.base_currency,
      b.month,
      b.year

    ORDER BY b.year DESC, b.month DESC;
    `;

    const result = await pool.query(q, params);

    let rows = result.rows;

    // if month/year filter provided, also include categories that have spend in that month but no budget
    if (month && year) {
      const spendRows = await pool.query(
        `SELECT
           NULL::uuid AS id,
           c.name AS category,
           NULL::numeric AS budget_amount,
           NULL::text AS currency,
           COALESCE(m.base_spent,0) AS base_amount,
           COALESCE(m.base_spent,0) AS spent,
           COALESCE(m.base_spent,0) AS remaining,
           m.month,
           m.year,
           c.id AS category_id
         FROM monthly_category_spend m
         JOIN categories c ON c.id = m.category_id
         WHERE m.user_id = $1 AND m.month = $2 AND m.year = $3
         AND NOT EXISTS (
           SELECT 1 FROM budgets b
           WHERE b.user_id = $1 AND b.category_id = c.id AND b.month = $2 AND b.year = $3
         )
        `,
        [userId, month, year]
      );

      // append spendRows that are not already present
      rows = rows.concat(spendRows.rows);
    }

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


/*
UPDATE BUDGET
*/
exports.updateBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { amount, currency } = req.body;

    // get user's primary currency
    const userCurrencyResult = await pool.query(
      `SELECT primary_currency FROM users WHERE id = $1`,
      [userId]
    );

    const baseCurrency =
      userCurrencyResult.rows[0]?.primary_currency || "INR";

    const { exchange_rate, base_amount } =
      await convertToBase(amount, currency, baseCurrency);

    const result = await pool.query(
      `UPDATE budgets
       SET amount = $1,
           currency = $2,
           base_amount = $3,
           base_currency = $4,
           exchange_rate = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        amount,
        currency,
        base_amount,
        baseCurrency,
        exchange_rate,
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
DELETE BUDGET
*/
exports.deleteBudget = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      `DELETE FROM budgets
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ message: "Budget deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
