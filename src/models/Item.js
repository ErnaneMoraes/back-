const { pool } = require('../../database');

class Item {
    constructor(
        idProduto = null,
        nome,
        quantidade = 0,
        precoCusto = 0,
        precoVenda = 0,
        descricao = '',
        tag = '',
        medida = 'un'
    ) {
        this.idProduto = Number(idProduto) || null;
        this.nome = String(nome);
        this.quantidade = Number(quantidade) || 0;
        this.precoCusto = Number(precoCusto) || 0;
        this.precoVenda = Number(precoVenda) || 0;
        this.descricao = String(descricao || '');
        this.tag = String(tag || '');
        this.medida = String(medida || 'un');
    }

    atualizarQuantidade(novaQuantidade) {
        if (novaQuantidade >= 0) {
            this.quantidade = novaQuantidade;
            return true;
        }
        throw new Error('A quantidade não pode ser negativa');
    }

    calcularValorTotal() {
        return this.quantidade * this.precoCusto;
    }

    calcularMargemLucro() {
        if (this.precoCusto === 0) return 0;
        return ((this.precoVenda - this.precoCusto) / this.precoCusto) * 100;
    }

    async salvar() {
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO tb_produto (
                    NOME, quantidade, precoCusto, precoVenda, 
                    DESCRICAO, TAG, MEDIDA
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`;

            const [result] = await connection.execute(query, [
                this.nome,
                this.quantidade,
                this.precoCusto,
                this.precoVenda,
                this.descricao,
                this.tag,
                this.medida
            ]);

            this.idProduto = result.insertId;
            return this.idProduto;
        } catch (error) {
            console.error('Erro ao salvar item:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async buscarPorId(idProduto) {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM tb_produto WHERE ID_PRODUTO_PK = ?',
                [idProduto]
            );

            if (rows.length === 0) return null;

            const itemData = rows[0];
            return new Item(
                itemData.ID_PRODUTO_PK,
                itemData.NOME,
                itemData.quantidade,
                itemData.precoCusto,
                itemData.precoVenda,
                itemData.DESCRICAO,
                itemData.TAG,
                itemData.MEDIDA
            );
        } catch (error) {
            console.error('Erro ao buscar item:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    static async listarTodos() {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM tb_produto ORDER BY NOME'
            );

            return rows.map(row => new Item(
                row.ID_PRODUTO_PK,
                row.NOME,
                row.quantidade,
                row.precoCusto,
                row.precoVenda,
                row.DESCRICAO,
                row.TAG,
                row.MEDIDA
            ));
        } catch (error) {
            console.error('Erro ao listar itens:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async atualizar() {
        if (!this.idProduto) {
            throw new Error('ID do produto não definido');
        }

        const connection = await pool.getConnection();
        try {
            const query = `
                UPDATE tb_produto SET
                    NOME = ?,
                    quantidade = ?,
                    precoCusto = ?,
                    precoVenda = ?,
                    DESCRICAO = ?,
                    TAG = ?,
                    MEDIDA = ?
                WHERE ID_PRODUTO_PK = ?`;

            const [result] = await connection.execute(query, [
                this.nome,
                this.quantidade,
                this.precoCusto,
                this.precoVenda,
                this.descricao,
                this.tag,
                this.medida,
                this.idProduto
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    async deletar() {
        if (!this.idProduto) {
            throw new Error('ID do produto não definido');
        }

        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                'DELETE FROM tb_produto WHERE ID_PRODUTO_PK = ?',
                [this.idProduto]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao deletar item:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Item;