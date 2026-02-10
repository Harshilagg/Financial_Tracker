const { Pool } = require("pg");
const path = require("path");
const dotenv = require("dotenv");

// Load .env locally (Render ignores this safely)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let pool;

if (process.env.DATABASE_URL) {
  // Production (Render PostgreSQL)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Local development (your current setup)
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
      ? parseInt(process.env.DB_PORT, 10)
      : 5432,
  });
}

module.exports = pool;