const express = require('express');
const router = express.Router();
const { pool } = require('./database');

// Função para normalizar os dados recebidos
function normalizarPessoa(pessoa) {
    const normalizar = (v) => (v === undefined || v === '' ? null : v);
    return {
        nome: normalizar(pessoa.nome),
        celular: normalizar(pessoa.celular),
        cpfCnpj: normalizar(pessoa.cpfCnpj),
        rua: normalizar(pessoa.rua),
        cep: normalizar(pessoa.cep),
        numero: pessoa.numero && !isNaN(pessoa.numero) ? parseInt(pessoa.numero) : null,
        bairro: normalizar(pessoa.bairro),
        cidade: normalizar(pessoa.cidade),
        uf: normalizar(pessoa.uf)
    };
}

// Criar nova pessoa
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const pessoa = normalizarPessoa(req.body);

        console.log('Valores recebidos:', pessoa);

        const [result] = await connection.execute(
            `INSERT INTO tb_pessoa 
             (NOME, CELULAR, CPF_CNPJ, RUA, CEP, NUMERO, BAIRRO, CIDADE, UF)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                pessoa.nome,
                pessoa.celular,
                pessoa.cpfCnpj,
                pessoa.rua,
                pessoa.cep,
                pessoa.numero,
                pessoa.bairro,
                pessoa.cidade,
                pessoa.uf
            ]
        );

        const novaPessoa = {
            id: result.insertId,
            nome: pessoa.nome,
            celular: pessoa.celular,
            cpfCnpj: pessoa.cpfCnpj,
            endereco: {
                rua: pessoa.rua,
                numero: pessoa.numero,
                bairro: pessoa.bairro,
                cidade: pessoa.cidade,
                uf: pessoa.uf
            }
        };

        res.status(201).json({
            success: true,
            data: novaPessoa
        });
    } catch (error) {
        console.error('Erro ao criar pessoa:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'CPF/CNPJ já cadastrado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao criar pessoa',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Listar todas as pessoas
router.get('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM tb_pessoa ORDER BY NOME'
        );

        res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Erro ao listar pessoas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar pessoas',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Buscar pessoa por ID
router.get('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM tb_pessoa WHERE ID_PESSOA_PK = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pessoa não encontrada'
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Erro ao buscar pessoa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar pessoa',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Atualizar pessoa
router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const pessoa = normalizarPessoa(req.body);

        const [result] = await connection.execute(
            `UPDATE tb_pessoa SET
                NOME = ?,
                CELULAR = ?,
                CPF_CNPJ = ?,
                RUA = ?,
                CEP = ?,
                NUMERO = ?,
                BAIRRO = ?,
                CIDADE = ?,
                UF = ?
             WHERE ID_PESSOA_PK = ?`,
            [
                pessoa.nome,
                pessoa.celular,
                pessoa.cpfCnpj,
                pessoa.rua,
                pessoa.cep,
                pessoa.numero,
                pessoa.bairro,
                pessoa.cidade,
                pessoa.uf,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pessoa não encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pessoa atualizada com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar pessoa:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'CPF/CNPJ já cadastrado para outra pessoa'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar pessoa',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// Excluir pessoa
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [result] = await connection.execute(
            'DELETE FROM tb_pessoa WHERE ID_PESSOA_PK = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pessoa não encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Pessoa excluída com sucesso'
        });
    } catch (error) {
        console.error('Erro ao excluir pessoa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir pessoa',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
