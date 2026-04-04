const express = require("express");
const pool = require("../config/pool");

const router = express.Router();

router.get("/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.json({
      success: true,
      message: "Database connection successful",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

module.exports = router;
