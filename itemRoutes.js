const express = require('express');
const router = express.Router();
const Item = require('./src/models/Item'); 
const { pool } = require('./database'); // Importação correta

// Middleware de validação para Item
const validarItem = (req, res, next) => {
    const { nome, precoCusto, precoVenda } = req.body;
    
    if (!nome || precoCusto === undefined || precoVenda === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Nome, preço de custo e preço de venda são obrigatórios'
        });
    }
    
    if (parseFloat(precoCusto) < 0 || parseFloat(precoVenda) < 0) {
        return res.status(400).json({
            success: false,
            message: 'Preços não podem ser negativos'
        });
    }
    
    next();
};

// Rota para criar item
router.post('/', validarItem, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { 
            nome, 
            quantidade = 0, 
            precoCusto, 
            precoVenda, 
            descricao = '', 
            tag = '', 
            medida = 'un' 
        } = req.body;
        
        const item = new Item(
            null, // idProduto será gerado pelo banco
            nome,
            parseInt(quantidade),
            parseFloat(precoCusto),
            parseFloat(precoVenda),
            descricao,
            tag,
            medida
        );

        const idProduto = await item.salvar();
        
        res.status(201).json({
            success: true,
            message: 'Item criado com sucesso',
            id: idProduto
        });
    } catch (error) {
        console.error('Erro ao criar item:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao criar item'
        });
    } finally {
        connection.release();
    }
});

// Rota para buscar item por ID
router.get('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const item = await Item.buscarPorId(req.params.id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }
        
        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Erro ao buscar item:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar item'
        });
    } finally {
        connection.release();
    }
});

// Rota para listar todos os itens
router.get('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const itens = await Item.listarTodos();
        
        res.status(200).json({
            success: true,
            data: itens
        });
    } catch (error) {
        console.error('Erro ao listar itens:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar itens'
        });
    } finally {
        connection.release();
    }
});

// Rota para atualizar item
router.put('/:id', validarItem, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Primeiro busca o item existente
        const itemExistente = await Item.buscarPorId(req.params.id);
        
        if (!itemExistente) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }

        // Atualiza os campos
        const { nome, quantidade, precoCusto, precoVenda, descricao, tag, medida } = req.body;
        
        itemExistente.nome = nome || itemExistente.nome;
        itemExistente.quantidade = quantidade !== undefined ? parseInt(quantidade) : itemExistente.quantidade;
        itemExistente.precoCusto = precoCusto !== undefined ? parseFloat(precoCusto) : itemExistente.precoCusto;
        itemExistente.precoVenda = precoVenda !== undefined ? parseFloat(precoVenda) : itemExistente.precoVenda;
        itemExistente.descricao = descricao || itemExistente.descricao;
        itemExistente.tag = tag || itemExistente.tag;
        itemExistente.medida = medida || itemExistente.medida;

        const sucesso = await itemExistente.atualizar();
        
        if (!sucesso) {
            throw new Error('Falha ao atualizar item');
        }
        
        res.status(200).json({
            success: true,
            message: 'Item atualizado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao atualizar item'
        });
    } finally {
        connection.release();
    }
});

// Rota para deletar item
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // Primeiro busca o item existente
        const itemExistente = await Item.buscarPorId(req.params.id);
        
        if (!itemExistente) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }

        // Verifica se há estoque antes de deletar
        if (itemExistente.quantidade > 0) {
            return res.status(400).json({
                success: false,
                message: 'Não é possível deletar um item com estoque positivo'
            });
        }

        const sucesso = await itemExistente.deletar();
        
        if (!sucesso) {
            throw new Error('Falha ao deletar item');
        }
        
        res.status(200).json({
            success: true,
            message: 'Item deletado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao deletar item:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao deletar item'
        });
    } finally {
        connection.release();
    }
});

// Rota para atualizar quantidade do item
router.patch('/:id/quantidade', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { quantidade } = req.body;
        
        if (quantidade === undefined || quantidade < 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantidade inválida'
            });
        }

        const item = await Item.buscarPorId(req.params.id);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item não encontrado'
            });
        }

        item.atualizarQuantidade(parseInt(quantidade));
        const sucesso = await item.atualizar();
        
        if (!sucesso) {
            throw new Error('Falha ao atualizar quantidade');
        }
        
        res.status(200).json({
            success: true,
            message: 'Quantidade atualizada com sucesso',
            valorTotal: item.calcularValorTotal(),
            margemLucro: item.calcularMargemLucro()
        });
    } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao atualizar quantidade'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;