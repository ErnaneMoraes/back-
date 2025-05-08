const { pool } = require('../../database');
const { hashPassword } = require('./encrypt');

class Usuario {
    constructor(idUsuario, nome, login, senha, nivelAcesso) {
        this.idUsuario = idUsuario;
        this.nome = nome;
        this.login = login;
        this.senha = senha;
        this.nivelAcesso = nivelAcesso;
    }

    async criarUsuario(nome, login, senha, nivelAcesso) {
      try {
          console.log("Criando usuário com:", nome, login, senha, nivelAcesso);
          const [rows] = await pool.execute('SELECT * FROM tb_usuario WHERE LOGIN = ?', [login]);
  
          // Esse console.log abaixo está errado e deve ser removido:
          // console.log("Resultado do UPDATE:", resultado);
          
          if (rows.length > 0) {
              return { erro: "Login já está em uso" };
          }
  
          const { salt, hash } = hashPassword(senha);
          const query = 'INSERT INTO tb_usuario (NOME, LOGIN, SENHA, SALT, NIVEL_ACESSO) VALUES (?, ?, ?, ?, ?)';
          const [results] = await pool.execute(query, [nome, login, hash, salt, nivelAcesso]);
  
          // Aqui também:
          // console.log("Resultado do UPDATE:", resultado);
  
          console.log("Usuário criado com sucesso, ID:", results.insertId);
          return { sucesso: true, id: results.insertId };
      } catch (err) {
          return { erro: "Erro ao criar usuário", detalhe: err.message };
      }
  }
  

    async excluirUsuario(id) {
        try {
            console.log("Iniciando exclusão de usuário com ID:", id); // Verifica se o método foi chamado
    
            const [resultado] = await pool.execute("DELETE FROM tb_usuario WHERE ID_USUARIO_PK = ?", [id]);
            console.log("Resultado do UPDATE:", resultado);

    
            console.log("Resultado da query DELETE:", resultado); // Mostra o resultado da execução da query
    
            if (resultado.affectedRows > 0) {
                console.log("Usuário excluído com sucesso!");
                return { sucesso: true };
            } else {
                console.log("Nenhum usuário encontrado com esse ID.");
                return { sucesso: false };
            }
        } catch (erro) {
            console.error("Erro ao excluir usuário no banco:", erro);
            throw new Error(`[Model:Usuario] Erro ao atualizar usuário: ${erro.message}`);
        }
    }

    async atualizarUsuario(id, dados) {
        try {
          let query = '';
          let params = [];
      
          if (dados.senha) {
            const { salt, hash } = hashPassword(dados.senha);
            query = `UPDATE tb_usuario SET NOME = ?, LOGIN = ?, SENHA = ?, SALT = ?, NIVEL_ACESSO = ? WHERE ID_USUARIO_PK = ?`;
            params = [dados.nome, dados.login, hash, salt, dados.nivelAcesso, id];
          } else {
            query = `UPDATE tb_usuario SET NOME = ?, LOGIN = ?, NIVEL_ACESSO = ? WHERE ID_USUARIO_PK = ?`;
            params = [dados.nome, dados.login, dados.nivelAcesso, id];
          }
      
          const [resultado] = await pool.execute(query, params);
          console.log("Resultado do UPDATE:", resultado);

      
          if (resultado.affectedRows === 0) {
            return { sucesso: false, mensagem: "Usuário não encontrado." };
          }
      
          return { sucesso: true };
        } catch (erro) {
          console.error("Erro no model ao atualizar:", erro);
          throw new Error(`[Model:Usuario] Erro ao atualizar usuário: ${erro.message}`);
        }
      }      
}



module.exports = Usuario;
