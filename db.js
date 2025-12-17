const mysql = require("mysql2/promise");
const { DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT } = require("./config");

// Tạo pool kết nối MySQL
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper thực thi query
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

module.exports = { pool, query };
