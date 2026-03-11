const { Pool } = require("pg");

const pool = new Pool({
  host:                    process.env.DB_HOST     || "postgres",
  port:                    process.env.DB_PORT     || 5432,
  user:                    process.env.DB_USER     || "postgres",
  password:                process.env.DB_PASSWORD || "root",
  database:                process.env.DB_NAME     || "ai_candidate_screening",
  max:                     20,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 10000,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err.message);
});

module.exports = pool;