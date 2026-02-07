const pool = require("../config/db");

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

    // Ensure category belongs to user AND is expense type
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

    const result = await pool.query(
      `INSERT INTO budgets
       (user_id, category_id, amount, currency, month, year)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [userId, category_id, amount, currency || "USD", month, year]
    );

    res.json(result.rows[0]);

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

    const result = await pool.query(
      `
      SELECT
        b.id,
        c.name AS category,
        b.amount AS budget_amount,
        b.currency,
        b.month,
        b.year,

        COALESCE(SUM(t.amount),0) AS spent,

        (b.amount - COALESCE(SUM(t.amount),0)) AS remaining

      FROM budgets b
      JOIN categories c ON b.category_id = c.id

      LEFT JOIN transactions t
        ON t.category_id = b.category_id
        AND t.user_id = b.user_id
        AND EXTRACT(MONTH FROM t.transaction_date) = b.month
        AND EXTRACT(YEAR FROM t.transaction_date) = b.year

      WHERE b.user_id = $1

      GROUP BY b.id, c.name
      ORDER BY b.year DESC, b.month DESC
      `,
      [userId]
    );

    res.json(result.rows);

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
    const { amount } = req.body;

    const result = await pool.query(
      `UPDATE budgets
       SET amount = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [amount, id, userId]
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
