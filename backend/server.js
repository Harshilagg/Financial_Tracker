require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

const pool = require("./src/config/db");

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("DB Error", err);
  } else {
    console.log("DB Connected:", res.rows[0]);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
