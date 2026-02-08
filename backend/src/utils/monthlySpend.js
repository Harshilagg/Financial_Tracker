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