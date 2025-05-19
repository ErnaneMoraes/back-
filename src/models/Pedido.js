const { pool } = require('../../database');

class Pedido {
    constructor(connection, idPessoa, dataPedido, status, itens, formaPgto, parcelas) {
        this.connection = connection;
        this.idPessoa = idPessoa;
        this.dataPedido = dataPedido || new Date();
        this.status = status;
        this.itens = itens;
        this.formaPgto = formaPgto;
        this.parcelas = parcelas;
    }

    async registrarPedido() {
        try {
            await this.connection.beginTransaction();

            const subtotal = this.itens.reduce((sum, item) => sum + (item.quantidade * item.precoUnitario), 0);
            const produto = this.itens[0];
            const vencimento = new Date();
            vencimento.setDate(vencimento.getDate() + 7);
            const total = subtotal;

            const [resultPedido] = await this.connection.execute(
                `INSERT INTO tb_pedido (
                    ID_PRODUTO_FK, 
                    ID_PESSOA_FK, 
                    QUANTIDADE, 
                    SUBTOTAL, 
                    FORMA_PGTO, 
                    PARCELAS, 
                    VENCIMENTO, 
                    TOTAL
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    produto.idProduto,
                    this.idPessoa,
                    produto.quantidade,
                    subtotal,
                    this.formaPgto,
                    this.parcelas,
                    vencimento.toISOString().split('T')[0],
                    total
                ]
            );

            const idPedido = resultPedido.insertId;

            await this.connection.execute(
                `INSERT INTO tb_hist_pedido (
                    ID_PEDIDO_FK, DATA, STATUS
                ) VALUES (?, ?, ?)`,
                [idPedido, new Date().toISOString().split('T')[0], this.status]
            );

            await this.connection.execute(
                `UPDATE tb_produto 
                 SET QUANTIDADE = QUANTIDADE - ? 
                 WHERE ID_PRODUTO_PK = ?`,
                [produto.quantidade, produto.idProduto]
            );

            await this.connection.commit();
            return idPedido;

        } catch (err) {
            await this.connection.rollback();
            console.error('Erro ao registrar pedido:', err);
            throw err;
        }
    }

    async atualizarStatus(idPedido, novoStatus) {
        try {
            await this.connection.beginTransaction();

            this.status = novoStatus;

            await this.connection.execute(
                `INSERT INTO tb_hist_pedido (
                    ID_PEDIDO_FK, DATA, STATUS
                ) VALUES (?, ?, ?)`,
                [idPedido, new Date().toISOString().split('T')[0], novoStatus]
            );

            if (novoStatus.toLowerCase() === 'cancelado') {
                const [pedido] = await this.connection.execute(
                    `SELECT ID_PRODUTO_FK, QUANTIDADE 
                     FROM tb_pedido 
                     WHERE ID_PEDIDO_PK = ?`,
                    [idPedido]
                );

                if (pedido.length > 0) {
                    const { ID_PRODUTO_FK, QUANTIDADE } = pedido[0];
                    await this.connection.execute(
                        `UPDATE tb_produto 
                         SET QUANTIDADE = QUANTIDADE + ? 
                         WHERE ID_PRODUTO_PK = ?`,
                        [QUANTIDADE, ID_PRODUTO_FK]
                    );
                }
            }

            await this.connection.commit();
            return true;

        } catch (err) {
            await this.connection.rollback();
            console.error('Erro ao atualizar status:', err);
            throw err;
        }
    }

    async consultarPedido(idPedido) {
        try {
            const [pedido] = await this.connection.execute(
                `SELECT * FROM tb_pedido WHERE ID_PEDIDO_PK = ?`,
                [idPedido]
            );

            if (pedido.length === 0) {
                throw new Error('Pedido não encontrado');
            }

            const [historico] = await this.connection.execute(
                `SELECT * FROM tb_hist_pedido 
                 WHERE ID_PEDIDO_FK = ? 
                 ORDER BY DATA DESC`,
                [idPedido]
            );

            return {
                ...pedido[0],
                historico
            };

        } catch (err) {
            console.error('Erro ao consultar pedido:', err);
            throw err;
        }
    }

    async atualizarPedido(idPedido, novosDados) {
        try {
            await this.connection.beginTransaction();

            const campos = [];
            const valores = [];

            for (const [campo, valor] of Object.entries(novosDados)) {
                if (campo !== 'status' && campo !== 'ID_PEDIDO_PK') {
                    campos.push(`${campo} = ?`);
                    valores.push(valor);
                }
            }

            if (campos.length > 0) {
                const query = `UPDATE tb_pedido SET ${campos.join(', ')} WHERE ID_PEDIDO_PK = ?`;
                valores.push(idPedido);
                await this.connection.execute(query, valores);
            }

            if (novosDados.status) {
                await this.connection.execute(
                    `INSERT INTO tb_hist_pedido (ID_PEDIDO_FK, DATA, STATUS) 
                     VALUES (?, ?, ?)`,
                    [idPedido, new Date().toISOString().split('T')[0], novosDados.status]
                );
            }

            await this.connection.commit();
            return true;

        } catch (err) {
            await this.connection.rollback();
            console.error('Erro ao atualizar pedido:', err);
            throw err;
        }
    }

    async deletarPedido(idPedido) {
        try {
            await this.connection.beginTransaction();

            await this.connection.execute(
                `DELETE FROM tb_hist_pedido WHERE ID_PEDIDO_FK = ?`,
                [idPedido]
            );

            const [result] = await this.connection.execute(
                `DELETE FROM tb_pedido WHERE ID_PEDIDO_PK = ?`,
                [idPedido]
            );

            if (result.affectedRows === 0) {
                throw new Error('Pedido não encontrado');
            }

            await this.connection.commit();
            return true;

        } catch (err) {
            await this.connection.rollback();
            console.error('Erro ao deletar pedido:', err);
            throw err;
        }
    }
}

module.exports = Pedido;