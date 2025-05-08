// routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
//const Usuario = require('./src/models/Usuario'); 

// Rota para criar usuário
router.post('/usuarios', async (req, res) => {
    try {
        const { nome, login, senha, nivelAcesso } = req.body;
        
        // Cria uma instância do usuário
        const usuario = new Usuario(null, nome, login, senha, nivelAcesso);
        
        // Chama o método criarUsuario
        await usuario.criarUsuario(nome, login, senha, nivelAcesso);
        
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao criar usuário 1'
        });
    }
});

// Rota para atualizar usuário
router.put('/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, login, senha, nivelAcesso } = req.body;
        
        const usuario = new Usuario(id, nome, login, senha, nivelAcesso);
        const resultado = await usuario.atualizarUsuario(id, nome, login, senha, nivelAcesso);
        
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao atualizar usuário'
        });
    }
});

// Rota para deletar usuário
router.delete('/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = new Usuario(id);
        const resultado = await usuario.deletarUsuario(id);
        
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao deletar usuário'
        });
    }
});

module.exports = router;