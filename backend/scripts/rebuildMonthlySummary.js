const pool = require("../src/config/db");

async function rebuild() {
  try {
    console.log("Rebuilding monthly_user_summary from monthly_category_spend...");

    const q = `
    WITH agg AS (
      SELECT mcs.user_id, mcs.month, mcs.year,
        SUM(CASE WHEN c.type = 'income' THEN mcs.base_spent ELSE 0 END) AS total_income,
        SUM(CASE WHEN c.type = 'expense' THEN mcs.base_spent ELSE 0 END) AS total_expense
      FROM monthly_category_spend mcs
      JOIN categories c ON mcs.category_id = c.id
      GROUP BY mcs.user_id, mcs.month, mcs.year
    )
    INSERT INTO monthly_user_summary (user_id, month, year, total_income, total_expense)
    SELECT user_id, month, year, total_income, total_expense FROM agg
    ON CONFLICT (user_id, month, year) DO UPDATE SET
      total_income = EXCLUDED.total_income,
      total_expense = EXCLUDED.total_expense;
    `;

    await pool.query(q);

    console.log("Rebuild complete.");
    process.exit(0);
  } catch (err) {
    console.error("Rebuild failed:", err);
    process.exit(1);
  }
}

rebuild();
