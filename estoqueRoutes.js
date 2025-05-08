const express = require('express');
const router = express.Router();
const Estoque = require('./src/models/Estoque'); 
const pool = require('./database'); 
const { Item } = require('./src/models/Item'); 

const validarMovimentacao = (req, res, next) => {
    const { tipoMovimentacao, quantidade, idProduto } = req.body;
    
    if (!tipoMovimentacao || !quantidade || !idProduto) {
        return res.status(400).json({
            success: false,
            message: 'Dados incompletos. Forneça tipoMovimentacao, quantidade e idProduto'
        });
    }
    
    if (!['ENTRADA', 'SAIDA'].includes(tipoMovimentacao)) {
        return res.status(400).json({
            success: false,
            message: 'Tipo de movimentação inválido. Use ENTRADA ou SAIDA'
        });
    }
    
    if (quantidade <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Quantidade deve ser maior que zero'
        });
    }
    
    next();
};

router.post('/movimentacao', validarMovimentacao, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { tipoMovimentacao, quantidade, idProduto, localizacao = 'Padrão', status = 'Ativo' } = req.body;
        
        const item = new Item(idProduto);
        
        const estoque = new Estoque(null, localizacao, item);
        
        await estoque.atualizarEstoque(tipoMovimentacao, quantidade, status);
        
        res.status(201).json({
            success: true,
            message: `Movimentação de ${tipoMovimentacao.toLowerCase()} registrada com sucesso`,
            saldoAtual: estoque.quantidade
        });
    } catch (error) {
        console.error('Erro ao registrar movimentação:', error);
        
        if (error.message.includes('Quantidade indisponível')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Erro ao registrar movimentação'
        });
    } finally {
        connection.release();
    }
});

router.get('/produto/:idProduto', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { idProduto } = req.params;
        
        const estoque = new Estoque();
        const dadosEstoque = await estoque.consultarEstoque(idProduto);
        
        res.status(200).json({
            success: true,
            data: dadosEstoque
        });
    } catch (error) {
        console.error('Erro ao consultar estoque:', error);
        
        if (error.message === 'ID do produto não especificado') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erro ao consultar estoque'
        });
    } finally {
        connection.release();
    }
});

router.get('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [estoques] = await connection.execute(
            `SELECT e.*, p.nome as produto_nome 
             FROM tb_estoque e
             JOIN tb_produto p ON e.ID_PRODUTO_FK = p.ID_PRODUTO_PK
             WHERE e.QUANTIDADE > 0
             ORDER BY e.LOCALIZACAO, p.nome`
        );
        
        res.status(200).json({
            success: true,
            data: estoques
        });
    } catch (error) {
        console.error('Erro ao listar estoque:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar estoque'
        });
    } finally {
        connection.release();
    }
});

router.post('/transferencia', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const { idProduto, quantidade, origem, destino } = req.body;
        
        if (!idProduto || !quantidade || !origem || !destino) {
            throw new Error('Dados incompletos. Forneça idProduto, quantidade, origem e destino');
        }
        
        if (quantidade <= 0) {
            throw new Error('Quantidade deve ser maior que zero');
        }
        
        if (origem === destino) {
            throw new Error('Origem e destino não podem ser iguais');
        }
        
        // 1. Verifica estoque na origem
        const [estoqueOrigem] = await connection.execute(
            `SELECT * FROM tb_estoque 
             WHERE ID_PRODUTO_FK = ? AND LOCALIZACAO = ?`,
            [idProduto, origem]
        );
        
        if (estoqueOrigem.length === 0 || estoqueOrigem[0].QUANTIDADE < quantidade) {
            throw new Error('Quantidade indisponível no local de origem');
        }
        
        // 2. Cria saída na origem
        await connection.execute(
            `UPDATE tb_estoque 
             SET QUANTIDADE = QUANTIDADE - ?,
                 DT_SAIDA = ?
             WHERE ID_ESTOQUE_PK = ?`,
            [quantidade, new Date().toISOString().split('T')[0], estoqueOrigem[0].ID_ESTOQUE_PK]
        );
        
        // 3. Verifica se existe registro no destino
        const [estoqueDestino] = await connection.execute(
            `SELECT * FROM tb_estoque 
             WHERE ID_PRODUTO_FK = ? AND LOCALIZACAO = ?`,
            [idProduto, destino]
        );
        
        if (estoqueDestino.length > 0) {
            // Atualiza estoque existente no destino
            await connection.execute(
                `UPDATE tb_estoque 
                 SET QUANTIDADE = QUANTIDADE + ?,
                     DT_ENTRADA = ?
                 WHERE ID_ESTOQUE_PK = ?`,
                [quantidade, new Date().toISOString().split('T')[0], estoqueDestino[0].ID_ESTOQUE_PK]
            );
        } else {
            // Cria novo registro no destino
            await connection.execute(
                `INSERT INTO tb_estoque (
                    ID_PRODUTO_FK, 
                    QUANTIDADE, 
                    DT_ENTRADA, 
                    LOCALIZACAO, 
                    STATUS
                ) VALUES (?, ?, ?, ?, ?)`,
                [idProduto, quantidade, new Date().toISOString().split('T')[0], destino, 'Ativo']
            );
        }
        
        await connection.commit();
        
        res.status(200).json({
            success: true,
            message: `Transferência de ${quantidade} unidades realizada com sucesso de ${origem} para ${destino}`
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao transferir estoque:', error);
        
        const statusCode = error.message.includes('Dados incompletos') || 
                         error.message.includes('Quantidade') ? 400 : 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Erro ao transferir estoque'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;