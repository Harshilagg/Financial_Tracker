const { parse } = require('csv-parse/sync');

function normalizeHeaderKey(k) {
  return String(k || '').toLowerCase().trim();
}

function parseAmountFromFields(fields) {
  // fields may contain amount, or debit & credit
  let raw = null;
  if (fields.amount !== undefined && fields.amount !== null && fields.amount !== '') raw = fields.amount;
  else if (fields.debit !== undefined && fields.debit !== null && fields.debit !== '') raw = `-${fields.debit}`;
  else if (fields.credit !== undefined && fields.credit !== null && fields.credit !== '') raw = fields.credit;

  if (raw === null) return 0;
  const cleaned = String(raw).replace(/[, ]+/g, '').replace(/\((.*)\)/, '-$1');
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

function mapRecordToRow(record) {
  const mapped = { date: null, description: '', amount: 0 };
  const fields = {};

  for (const keyRaw of Object.keys(record)) {
    const key = normalizeHeaderKey(keyRaw);
    const val = record[keyRaw];
    if (key.includes('date')) fields.date = val;
    else if (key.includes('desc') || key.includes('narr') || key.includes('detail')) fields.description = val;
    else if (key === 'amount' || key.includes('amount')) fields.amount = val;
    else if (key.includes('debit') || key === 'dr') fields.debit = val;
    else if (key.includes('credit') || key === 'cr') fields.credit = val;
    else {
      // fallback: if header contains common aliases
      if (key.includes('txn') && key.includes('date')) fields.date = val;
    }
  }

  mapped.date = fields.date || Object.values(record)[0];
  mapped.description = fields.description || Object.values(record)[1] || '';
  mapped.amount = parseAmountFromFields(fields);
  if (mapped.date && mapped.date.trim) mapped.date = mapped.date.trim();
  if (mapped.description && mapped.description.trim) mapped.description = mapped.description.trim();

  return mapped;
}

function parseCsv(buffer) {
  const text = buffer.toString('utf8');
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
  if (!records || !records.length) return [];

  const rows = records.map(r => mapRecordToRow(r));
  return rows;
}

module.exports = { parseCsv };
