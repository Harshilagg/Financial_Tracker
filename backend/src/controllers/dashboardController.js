const pool = require("../config/db");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    /* TOTAL INCOME */
    const incomeResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total_income
       FROM transactions
       WHERE user_id = $1 AND type = 'income'`,
      [userId]
    );

    /* TOTAL EXPENSE */
    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS total_expense
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'`,
      [userId]
    );

    const totalIncome = parseFloat(incomeResult.rows[0].total_income);
    const totalExpense = parseFloat(expenseResult.rows[0].total_expense);

    /* EXPENSE BY CATEGORY */
    const categoryResult = await pool.query(
      `SELECT c.name,
              SUM(t.amount) AS total
       FROM transactions t
       JOIN categories c
       ON t.category_id = c.id
       WHERE t.user_id = $1
       AND t.type = 'expense'
       GROUP BY c.name
       ORDER BY total DESC`,
      [userId]
    );

    /* MONTHLY SUMMARY */
    const monthlyResult = await pool.query(
      `SELECT
          TO_CHAR(transaction_date, 'YYYY-MM') AS month,
          SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
       FROM transactions
       WHERE user_id = $1
       GROUP BY month
       ORDER BY month`,
      [userId]
    );

    res.json({
      total_income: totalIncome,
      total_expense: totalExpense,
      savings: totalIncome - totalExpense,
      expense_by_category: categoryResult.rows,
      monthly_summary: monthlyResult.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
