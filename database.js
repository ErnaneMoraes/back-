const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function connectDB() {
  try {
    const connection = await pool.getConnection();
    console.log("Conectado ao MySQL com sucesso!");
    connection.release();
  } catch (err) {
    console.error("Erro ao conectar ao MySQL:", err);
  }
}

module.exports = { connectDB, pool };