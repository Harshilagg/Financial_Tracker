const pool = require("../config/db");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    /* TOTAL INCOME AND EXPENSE */
    const summaryResult = await pool.query(
      `SELECT COALESCE(SUM(total_income), 0) AS total_income,
              COALESCE(SUM(total_expense), 0) AS total_expense
       FROM monthly_user_summary
       WHERE user_id = $1`,
      [userId]
    );

    const totalIncome = parseFloat(summaryResult.rows[0].total_income);
    const totalExpense = parseFloat(summaryResult.rows[0].total_expense);

    /* EXPENSE BY CATEGORY */
    const categoryResult = await pool.query(
      `SELECT c.name,
              COALESCE(SUM(mcs.base_spent), 0) AS total
       FROM monthly_category_spend mcs
       JOIN categories c
       ON mcs.category_id = c.id
       WHERE mcs.user_id = $1
       GROUP BY c.name
       ORDER BY total DESC`,
      [userId]
    );

    /* MONTHLY SUMMARY (per month/year) */
    const monthlyResult = await pool.query(
      `SELECT month, year, COALESCE(total_income,0) AS income, COALESCE(total_expense,0) AS expense
       FROM monthly_user_summary
       WHERE user_id = $1
       ORDER BY year DESC, month DESC
       LIMIT 12`,
      [userId]
    );

    // get user's base currency
    const userRes = await pool.query(`SELECT primary_currency FROM users WHERE id = $1`, [userId]);
    const base_currency = userRes.rows[0]?.primary_currency || "INR";

    const savings = totalIncome - totalExpense;

    res.json({
      total_income: totalIncome,
      total_expense: totalExpense,
      savings,
      base_currency,
      expense_by_category: categoryResult.rows,
      monthly_summary: monthlyResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
