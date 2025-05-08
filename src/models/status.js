const express = require("express");
const mysql = require("mysql2/promise");
const router = express.Router();

require('dotenv').config();

// Criação do pool de conexões com o MySQL
const pool = mysql.createPool({
  host: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função para verificar a conexão com o banco de dados usando o pool
async function checkDatabaseConnection() {
    try {
        const connection = await pool.getConnection(); // Obtém uma conexão do pool
        await connection.ping(); // Testa a conexão
        connection.release(); // Libera a conexão de volta para o pool
        return true;
    } catch (error) {
        console.error("Erro ao conectar ao banco de dados:", error);
        return false;
    }
}

// Endpoint de status
router.get("/status", async (req, res) => {
    const dbStatus = await checkDatabaseConnection();
    res.json({ api: true, db: dbStatus }); // API sempre retorna true se chegou aqui
});

module.exports = router;
