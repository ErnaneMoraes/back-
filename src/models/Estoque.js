const { item } = require('./Item');

class Estoque {
    constructor(idEstoque, localizacao, item) {
        this.idEstoque = idEstoque;
        this.localizacao = localizacao;
        this.item = item;
        this.quantidade = 0;
        this.historico = [];
    }

    async atualizarEstoque(tipoMovimentacao, quantidade, status = 'Ativo') {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            if (!['ENTRADA', 'SAIDA'].includes(tipoMovimentacao)) {
                throw new Error('Tipo de movimentação inválido. Use ENTRADA ou SAIDA');
            }

            if (quantidade <= 0) {
                throw new Error('Quantidade deve ser maior que zero');
            }

            if (tipoMovimentacao === 'SAIDA' && quantidade > this.quantidade) {
                throw new Error('Quantidade indisponível em estoque');
            }

            if (tipoMovimentacao === 'ENTRADA') {
                this.quantidade += quantidade;
            } else {
                this.quantidade -= quantidade;
            }

            const [estoqueExistente] = await connection.execute(
                'SELECT * FROM tb_estoque WHERE ID_PRODUTO_FK = ?',
                [this.item.ID_PRODUTO_PK]
            );

            const dataAtual = new Date().toISOString().split('T')[0];

            if (estoqueExistente.length > 0) {
                await connection.execute(
                    `UPDATE tb_estoque 
                     SET QUANTIDADE = ?, 
                         DT_${tipoMovimentacao} = ?,
                         LOCALIZACAO = ?,
                         STATUS = ?
                     WHERE ID_ESTOQUE_PK = ?`,
                    [
                        this.quantidade,
                        dataAtual,
                        this.localizacao,
                        status,
                        estoqueExistente[0].ID_ESTOQUE_PK
                    ]
                );
                this.idEstoque = estoqueExistente[0].ID_ESTOQUE_PK;
            } else {
                const [result] = await connection.execute(
                    `INSERT INTO tb_estoque (
                        ID_PRODUTO_FK, 
                        QUANTIDADE, 
                        DT_ENTRADA, 
                        DT_SAIDA, 
                        LOCALIZACAO, 
                        STATUS
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        this.item.ID_PRODUTO_PK,
                        this.quantidade,
                        tipoMovimentacao === 'ENTRADA' ? dataAtual : null,
                        tipoMovimentacao === 'SAIDA' ? dataAtual : null,
                        this.localizacao,
                        status
                    ]
                );
                this.idEstoque = result.insertId;
            }

            this.historico.push({
                data: new Date(),
                tipo: tipoMovimentacao,
                quantidade,
                saldoAtual: this.quantidade,
                localizacao: this.localizacao
            });

            await connection.commit();
            return true;

        } catch (err) {
            await connection.rollback();
            console.error('Erro ao atualizar estoque:', err);
            throw err;
        } finally {
            connection.release();
        }
    }


    async consultarEstoque(idProduto = null) {
        const connection = await pool.getConnection();
        try {
            const produtoId = idProduto || this.item?.ID_PRODUTO_PK;

            if (!produtoId) {
                throw new Error('ID do produto não especificado');
            }

            const [estoque] = await connection.execute(
                `SELECT * FROM tb_estoque 
                 WHERE ID_PRODUTO_FK = ? 
                 ORDER BY DT_ENTRADA DESC 
                 LIMIT 1`,
                [produtoId]
            );

            if (estoque.length === 0) {
                return {
                    disponivel: 0,
                    localizacao: null,
                    status: 'Inexistente',
                    historico: []
                };
            }

            this.idEstoque = estoque[0].ID_ESTOQUE_PK;
            this.quantidade = estoque[0].QUANTIDADE;
            this.localizacao = estoque[0].LOCALIZACAO;

            const [movimentacoes] = await connection.execute(
                `SELECT 
                    DT_ENTRADA as data,
                    'ENTRADA' as tipo,
                    QUANTIDADE as quantidade,
                    LOCALIZACAO as localizacao
                 FROM tb_estoque
                 WHERE ID_PRODUTO_FK = ? AND DT_ENTRADA IS NOT NULL
                 
                 UNION ALL
                 
                 SELECT 
                    DT_SAIDA as data,
                    'SAIDA' as tipo,
                    QUANTIDADE as quantidade,
                    LOCALIZACAO as localizacao
                 FROM tb_estoque
                 WHERE ID_PRODUTO_FK = ? AND DT_SAIDA IS NOT NULL
                 
                 ORDER BY data DESC`,
                [produtoId, produtoId]
            );

            this.historico = movimentacoes;

            return {
                idEstoque: estoque[0].ID_ESTOQUE_PK,
                idProduto: estoque[0].ID_PRODUTO_FK,
                disponivel: estoque[0].QUANTIDADE,
                localizacao: estoque[0].LOCALIZACAO,
                status: estoque[0].STATUS,
                ultimaEntrada: estoque[0].DT_ENTRADA,
                ultimaSaida: estoque[0].DT_SAIDA,
                historico: movimentacoes
            };

        } catch (err) {
            console.error('Erro ao consultar estoque:', err);
            throw err;
        } finally {
            connection.release();
        }
    }
}

module.exports = Estoque;