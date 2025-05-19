const express = require('express');
const router = express.Router();
const Pedido = require('./src/models/Pedido');
const { pool } = require('./database');

const validarPedido = (req, res, next) => {
    const { idPessoa, listaItens, formaPgto, parcelas } = req.body;

    if (!idPessoa || !listaItens || !formaPgto || !parcelas) {
        return res.status(400).json({
            success: false,
            message: 'Dados incompletos. Forneça idPessoa, listaItens, formaPgto e parcelas'
        });
    }

    if (listaItens.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'O pedido deve conter pelo menos um item'
        });
    }

    next();
};

router.post('/', validarPedido, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { idPessoa, listaItens, formaPgto, parcelas, status = 'Aberto' } = req.body;

        const pedido = new Pedido(
            connection,
            idPessoa,
            new Date(),
            status,
            listaItens,
            formaPgto,
            parcelas
        );

        const idPedido = await pedido.registrarPedido();

        res.status(201).json({
            success: true,
            message: 'Pedido criado com sucesso',
            idPedido
        });
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao criar pedido'
        });
    } finally {
        connection.release();
    }
});

router.get('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const pedido = new Pedido(connection);
        const dadosPedido = await pedido.consultarPedido(id);

        res.status(200).json({
            success: true,
            data: dadosPedido
        });
    } catch (error) {
        console.error('Erro ao consultar pedido:', error);

        if (error.message === 'Pedido não encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao consultar pedido'
        });
    } finally {
        connection.release();
    }
});

router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const novosDados = req.body;

        const pedido = new Pedido(connection);
        await pedido.atualizarPedido(id, novosDados);

        res.status(200).json({
            success: true,
            message: 'Pedido atualizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);

        if (error.message === 'Pedido não encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar pedido'
        });
    } finally {
        connection.release();
    }
});

router.patch('/:id/status', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'O novo status deve ser fornecido'
            });
        }

        const pedido = new Pedido(connection);
        await pedido.atualizarStatus(id, status);

        res.status(200).json({
            success: true,
            message: 'Status do pedido atualizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar status do pedido:', error);

        if (error.message === 'Pedido não encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status do pedido'
        });
    } finally {
        connection.release();
    }
});

router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        const pedido = new Pedido(connection);
        await pedido.deletarPedido(id);

        res.status(200).json({
            success: true,
            message: 'Pedido deletado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao deletar pedido:', error);

        if (error.message === 'Pedido não encontrado') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro ao deletar pedido'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;