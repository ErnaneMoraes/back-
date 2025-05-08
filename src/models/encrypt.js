require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const crypto = require('crypto');
const { pool } = require('../../database'); // Usando o pool configurado em 'database.js'

// Função para gerar hash da senha com PBKDF2 e salt
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex'); // Gera um salt aleatório
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

// Função para registrar um novo usuário
async function registerUser(nome, login, senha, nivelAcesso) {
    try {
        // Verifica se o login já está em uso
        const [rows] = await pool.execute('SELECT * FROM tb_usuario WHERE LOGIN = ?', [login]);
        if (rows.length > 0) {
            console.log('ALERTA: O login já está em uso.');
            return;
        }

        // Gera o hash da senha
        const { salt, hash } = hashPassword(senha);

        // Insere o novo usuário no banco de dados
        const query = 'INSERT INTO tb_usuario (NOME, LOGIN, SENHA, SALT, NIVEL_ACESSO) VALUES (?, ?, ?, ?, ?)';
        const [results] = await pool.execute(query, [nome, login, hash, salt, nivelAcesso]);
        console.log('Usuário registrado com sucesso! ID:', results.insertId);
    } catch (err) {
        console.error('Erro ao registrar usuário:', err);
    }
}

module.exports = {
    hashPassword,
    registerUser
};


/* Exemplo de uso:
registerUser('Ernane Moraes', 'ernane.moraes', 'Unileste', 1);
registerUser('Cauã Matteus', 'caua.matteus', 'Unileste', 1);
registerUser('Lucimar Ferreira', 'lucimar.ferreira', 'Unileste', 1);
registerUser('Matheus Fernando', 'matheus.fernando', 'Unileste', 1);
registerUser('Luan Venancio', 'luan.venancio', 'Unileste', 1);
*/
