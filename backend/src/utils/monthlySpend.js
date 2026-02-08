const pool = require("../config/db");

/*
Update monthly spend summary
Called whenever a transaction is created
*/
exports.updateMonthlySpend = async ({
  user_id,
  category_id,
  transaction_date,
  base_amount
}) => {
  const date = new Date(transaction_date);

  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  await pool.query(
    `
    INSERT INTO monthly_category_spend
    (user_id, category_id, month, year, base_spent)
    VALUES ($1,$2,$3,$4,$5)

    ON CONFLICT (user_id, category_id, month, year)
    DO UPDATE SET
      base_spent =
        monthly_category_spend.base_spent + EXCLUDED.base_spent
    `,
    [user_id, category_id, month, year, base_amount]
  );
};

exports.updateMonthlySummary = async ({
  user_id,
  transaction_date,
  base_amount,
  type
}) => {
  const date = new Date(transaction_date);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const column = type === "income" ? "total_income" : "total_expense";

  await pool.query(
    `INSERT INTO monthly_user_summary
    (user_id, month, year, ${column})
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, month, year)
    DO UPDATE SET
      ${column} = monthly_user_summary.${column} + EXCLUDED.${column}`,
    [user_id, month, year, base_amount]
  );
};