const { pool } = require('../../database');

class Pessoa {
    constructor(idPessoa, nome, celular, cpfCnpj, rua, numero, bairro, cidade, uf) {
        this.idPessoa = idPessoa;
        this.nome = nome;
        this.celular = celular;
        this.cpfCnpj = cpfCnpj;
        this.rua = rua;
        this.numero = numero;
        this.bairro = bairro;
        this.cidade = cidade;
        this.uf = uf;
    }

    async criarPessoa(nome, celular, cpfCnpj, rua, numero, bairro, cidade, uf) {
        try {
            console.log("Criando pessoa com:", nome, celular, cpfCnpj);
            
            // Verifica se o CPF/CNPJ já está cadastrado
            const [rows] = await pool.execute('SELECT * FROM tb_pessoa WHERE CPF_CNPJ = ?', [cpfCnpj]);
            
            if (rows.length > 0) {
                return { erro: "CPF/CNPJ já cadastrado" };
            }

            const query = `INSERT INTO tb_pessoa 
                          (NOME, CELULAR, CPF_CNPJ, RUA, NUMERO, BAIRRO, CIDADE, UF) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const [results] = await pool.execute(query, 
                [nome, celular, cpfCnpj, rua, numero, bairro, cidade, uf]);

            console.log("Pessoa criada com sucesso, ID:", results.insertId);
            return { 
                sucesso: true, 
                id: results.insertId,
                pessoa: new Pessoa(
                    results.insertId,
                    nome,
                    celular,
                    cpfCnpj,
                    rua,
                    numero,
                    bairro,
                    cidade,
                    uf
                )
            };
        } catch (err) {
            console.error("Erro ao criar pessoa:", err);
            return { erro: "Erro ao criar pessoa", detalhe: err.message };
        }
    }

    async excluirPessoa(id) {
        try {
            console.log("Iniciando exclusão de pessoa com ID:", id);

            const [resultado] = await pool.execute(
                "DELETE FROM tb_pessoa WHERE ID_PESSOA_PK = ?", 
                [id]
            );
            console.log("Resultado da query DELETE:", resultado);

            if (resultado.affectedRows > 0) {
                console.log("Pessoa excluída com sucesso!");
                return { sucesso: true };
            } else {
                console.log("Nenhuma pessoa encontrada com esse ID.");
                return { sucesso: false };
            }
        } catch (erro) {
            console.error("Erro ao excluir pessoa no banco:", erro);
            throw new Error(`[Model:Pessoa] Erro ao excluir pessoa: ${erro.message}`);
        }
    }

    async atualizarPessoa(id, dados) {
        try {
            const query = `UPDATE tb_pessoa SET 
                          NOME = ?, CELULAR = ?, CPF_CNPJ = ?, 
                          RUA = ?, NUMERO = ?, BAIRRO = ?, 
                          CIDADE = ?, UF = ?
                          WHERE ID_PESSOA_PK = ?`;
            
            const params = [
                dados.nome, 
                dados.celular, 
                dados.cpfCnpj,
                dados.rua, 
                dados.numero, 
                dados.bairro,
                dados.cidade, 
                dados.uf, 
                id
            ];

            const [resultado] = await pool.execute(query, params);
            console.log("Resultado do UPDATE:", resultado);

            if (resultado.affectedRows === 0) {
                return { sucesso: false, mensagem: "Pessoa não encontrada." };
            }

            return { 
                sucesso: true,
                pessoa: new Pessoa(
                    id,
                    dados.nome,
                    dados.celular,
                    dados.cpfCnpj,
                    dados.rua,
                    dados.numero,
                    dados.bairro,
                    dados.cidade,
                    dados.uf
                )
            };
        } catch (erro) {
            console.error("Erro no model ao atualizar:", erro);
            throw new Error(`[Model:Pessoa] Erro ao atualizar pessoa: ${erro.message}`);
        }
    }

    static async buscarPorId(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM tb_pessoa WHERE ID_PESSOA_PK = ?', 
                [id]
            );
            
            if (rows.length === 0) {
                return null;
            }

            const pessoaData = rows[0];
            return new Pessoa(
                pessoaData.ID_PESSOA_PK,
                pessoaData.NOME,
                pessoaData.CELULAR,
                pessoaData.CPF_CNPJ,
                pessoaData.RUA,
                pessoaData.NUMERO,
                pessoaData.BAIRRO,
                pessoaData.CIDADE,
                pessoaData.UF
            );
        } catch (erro) {
            console.error("Erro ao buscar pessoa por ID:", erro);
            throw new Error(`[Model:Pessoa] Erro ao buscar pessoa: ${erro.message}`);
        }
    }

    static async listarPessoas() {
        try {
            const [rows] = await pool.execute('SELECT * FROM tb_pessoa');
            return rows.map(pessoaData => new Pessoa(
                pessoaData.ID_PESSOA_PK,
                pessoaData.NOME,
                pessoaData.CELULAR,
                pessoaData.CPF_CNPJ,
                pessoaData.RUA,
                pessoaData.NUMERO,
                pessoaData.BAIRRO,
                pessoaData.CIDADE,
                pessoaData.UF
            ));
        } catch (erro) {
            console.error("Erro ao listar pessoas:", erro);
            throw new Error(`[Model:Pessoa] Erro ao listar pessoas: ${erro.message}`);
        }
    }

    validarDocumento() {
        if (!this.cpfCnpj) return false;
        
        const documento = this.cpfCnpj.replace(/\D/g, '');
        
        if (documento.length === 11 || documento.length === 14) {
            console.log(`Documento "${this.cpfCnpj}" válido.`);
            return true;
        } else {
            console.log(`Documento "${this.cpfCnpj}" inválido.`);
            return false;
        }
    }
}

module.exports = Pessoa;