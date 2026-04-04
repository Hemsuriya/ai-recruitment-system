require("dotenv").config();

const pool = require("../src/config/pool");

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW() AS current_time, current_database() AS database_name");
    console.log("✅ Database connection successful");
    console.log(`Database: ${result.rows[0].database_name}`);
    console.log(`Time: ${result.rows[0].current_time}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end().catch(() => {});
  }
}

testConnection();
