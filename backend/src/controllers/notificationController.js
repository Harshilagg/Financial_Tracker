const pool = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const q = await pool.query(
      `SELECT id, type, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );
    res.json(q.rows);
  } catch (e) {
    console.error('getNotifications error', e.message || e);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('markAsRead error', e.message || e);
    res.status(500).json({ error: 'Server error' });
  }
};
