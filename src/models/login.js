require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const crypto = require('crypto');
const { pool } = require('../../database'); // Usando o pool configurado em 'database.js'
const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY;

const express = require('express');
const router = express.Router();

// Função para verificar a senha
function verifyPassword(password, storedHash, salt) {
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return storedHash === hashToVerify;
}

function verifyJWT(req, res, next) {
    const token = req.headers['x-access-token'];
    
    if (!token) {
        return res.status(403).json({ message: 'Nenhum token fornecido!' });
    }

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido!' });
        }

        req.login = decoded.login; // Armazena login no request
        next(); // Permite continuar a requisição
    });
}

router.get("/verify-token", (req, res) => {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Token não fornecido" });
    }

    jwt.verify(token, SECRET, (err, decoded) => { // Alterado para usar SECRET
        if (err) {
            return res.status(403).json({ message: "Token inválido ou expirado" });
        }
        res.json({ message: "Token válido", user: decoded });
    });
});




// Função para autenticar o usuário
async function loginUser(login, senha) {
    try {
        // Executa a consulta para buscar o usuário e a senha
        const [rows] = await pool.execute('SELECT SENHA, SALT FROM tb_usuario WHERE LOGIN = ?', [login]);

        if (rows.length === 0) {
            console.log('Usuário não encontrado!');
            return false; // Retorna false se não encontrar o usuário
        }

        const { SENHA: storedHash, SALT: salt } = rows[0];

        // Verifica a senha
        return verifyPassword(senha, storedHash, salt);
    } catch (err) {
        console.error('Erro ao executar a consulta:', err);
        throw new Error('Erro ao fazer login');
    }
}

//Rota POST para login
router.post('/', async (req, res) => {
    const { login, senha } = req.body;
    console.log(`Recebido login: ${login}, senha: ${senha}`);

    try {
        const success = await loginUser(login, senha);
        if (success) {
            const token = jwt.sign({ login: 1 }, SECRET, { expiresIn: '12h' });
            return res.status(200).json({ auth: true, token, message: 'Login bem-sucedido!' });
        } else {
            return res.status(401).json({ message: 'Credenciais inválidas!' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Erro no servidor!', error: error.message });
    }
    
});

module.exports = { router, verifyJWT };
