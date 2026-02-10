const pool = require('../config/db');
const { parseCsv } = require('../services/bankParser');
const { convertToBase } = require('../utils/currency');
const { updateMonthlySpend, updateMonthlySummary } = require('../utils/monthlySpend');

async function findOrCreateCategory(userId, name, type = 'expense') {
  const cleanName = String(name || '').trim();
  const q = await pool.query('SELECT * FROM categories WHERE user_id=$1 AND lower(trim(name))=lower(trim($2)) LIMIT 1', [userId, cleanName]);
  if (q.rows.length) return { id: q.rows[0].id, created: false, row: q.rows[0] };
  const ins = await pool.query('INSERT INTO categories(user_id,name,type) VALUES($1,$2,$3) RETURNING *', [userId, cleanName, type]);
  return { id: ins.rows[0].id, created: true, row: ins.rows[0] };
}

function detectCategoryName(description) {
  const d = String(description || '').toLowerCase();
  if (d.match(/swiggy|zomato|restaurant|cafe|food/)) return 'Food';
  if (d.match(/uber|ola|bolt|taxi|cab/)) return 'Transport';
  if (d.match(/amazon|flipkart|myntra|shopping/)) return 'Shopping';
  if (d.match(/rent/)) return 'Rent';
  if (d.match(/salary|payroll|credit/)) return 'Income';
  return 'Uncategorized';
}

exports.importStatement = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No file uploaded' });
    const userId = req.user.id;
    const rows = parseCsv(req.file.buffer);

    const created = [];
    const skipped = [];

    // fetch user's primary currency once
    const userCurrencyResult = await pool.query(`SELECT primary_currency FROM users WHERE id = $1`, [userId]);
    const userCurrency = userCurrencyResult.rows[0]?.primary_currency || 'INR';
    const baseCurrency = userCurrency;
    const newCategories = [];

    for (const r of rows) {
      const transaction_date = r.date || null;
      const description = r.description || '';
      const amount = Number(r.amount || 0);
      if (!transaction_date || amount === 0) {
        skipped.push({ reason: 'invalid', row: r });
        continue;
      }

      const type = amount > 0 ? 'income' : 'expense';
      const absAmount = Math.abs(amount);

      // dedupe: same date, similar amount (+-0.5) and similar description
      const ded = await pool.query(`SELECT id, amount, description FROM transactions WHERE user_id=$1 AND transaction_date=$2 AND ABS(CAST(amount AS numeric) - $3) < 0.5 LIMIT 1`, [userId, transaction_date, absAmount]);
      if (ded.rows.length) {
        const existing = ded.rows[0];
        if (existing.description && description && existing.description.toLowerCase().includes(description.toLowerCase().slice(0, 10))) {
          skipped.push({ reason: 'duplicate', row: r, existing: existing.id });
          continue;
        }
      }

      // determine category (ensure category type matches transaction type)
      let categoryName = detectCategoryName(description);
      const category_type = type; // enforce transaction type
      const catRes = await findOrCreateCategory(userId, categoryName, category_type);
      const category_id = catRes.id;
      if (catRes.created) newCategories.push(catRes.row);

      // convert to base using user's primary currency
      const { exchange_rate, base_amount } = await convertToBase(absAmount, userCurrency, baseCurrency).catch(()=>({ exchange_rate: 1, base_amount: absAmount }));

      const insert = await pool.query(`INSERT INTO transactions (user_id, category_id, type, amount, currency, description, transaction_date, is_refund, base_currency, exchange_rate, base_amount) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [userId, category_id, type, absAmount, userCurrency, description, transaction_date, false, baseCurrency, exchange_rate, base_amount]);

      // update monthly summaries (best-effort)
      try {
        await updateMonthlySpend({ user_id: userId, category_id, transaction_date, base_amount });
        await updateMonthlySummary({ user_id: userId, transaction_date, base_amount, type });
      } catch (e) { console.error('monthly update failed', e.message || e); }

      created.push(insert.rows[0]);
    }

    res.json({ created_count: created.length, skipped_count: skipped.length, created, skipped, new_categories_count: newCategories.length, new_categories: newCategories });
  } catch (e) {
    console.error('importStatement error', e.message || e);
    res.status(500).json({ error: 'Server error' });
  }
};
