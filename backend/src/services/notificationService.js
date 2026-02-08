const pool = require('../config/db');
const sgMail = require('@sendgrid/mail');
const { SENDGRID_API_KEY, NOTIFICATION_FROM_EMAIL } = process.env;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

async function createNotificationRow(user_id, type, message) {
  try {
    await pool.query(
      `INSERT INTO notifications(user_id, type, message) VALUES($1,$2,$3)`,
      [user_id, type, message]
    );
  } catch (e) {
    console.error('Failed inserting notification row', e.message || e);
  }
}

async function sendEmail(to, subject, text) {
  if (!SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not set, skipping send');
    return;
  }
  const msg = {
    to,
    from: NOTIFICATION_FROM_EMAIL,
    subject,
    text
  };
  try {
    await sgMail.send(msg);
  } catch (e) {
    console.error('SendGrid send error', e.message || e);
    throw e;
  }
}

async function notifyBudgetOverrun(user_id, budget, spent) {
  const message = `Your budget for ${budget.category} (${budget.month}/${budget.year}) has been exceeded. Spent: ${spent}, Budget: ${budget.base_amount}`;

  // insert notification row (best-effort)
  await createNotificationRow(user_id, 'budget_overrun', message);

  // lookup user's email
  try {
    const res = await pool.query('SELECT email FROM users WHERE id = $1', [user_id]);
    const userEmail = res.rows[0]?.email;
    if (!userEmail) return;
    // send email but do not let failure block caller
    try {
      await sendEmail(userEmail, 'Budget exceeded', message);
    } catch (e) {
      console.error('Email send failed (non-blocking)', e.message || e);
    }
  } catch (e) {
    console.error('Failed to lookup user for notification', e.message || e);
  }
}

module.exports = {
  notifyBudgetOverrun,
  sendEmail,
  createNotificationRow
};
