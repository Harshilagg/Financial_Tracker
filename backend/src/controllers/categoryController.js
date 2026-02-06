const pool = require("../config/db");

/*
CREATE CATEGORY
*/
exports.createCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        error: "Name and type are required"
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        error: "Invalid category type"
      });
    }

    const result = await pool.query(
      `INSERT INTO categories (user_id, name, type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name, type]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


/*
GET USER CATEGORIES
*/
exports.getCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT *
       FROM categories
       WHERE user_id = $1
       AND is_deleted = false
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


/*
SOFT DELETE CATEGORY
*/
exports.deleteCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query(
      `UPDATE categories
       SET is_deleted = true
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({ message: "Category deleted" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
