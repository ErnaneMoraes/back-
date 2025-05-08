const connection = require('./database');

function consultarDados() {
    const query = 'SELECT * FROM tb_usuario'; 
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
        } else {
            console.log('Resultado da consulta:', results);
        }

        connection.end();
    });
}

// updateDados(5, "LuanUnileste01!");
consultarDados();

// function updateDados(idUsuario, novaSenha){
//     const query = 'UPDATE tb_usuario SET SENHA = ? WHERE ID_USUARIO_PK = ?'
//     connection.query(query, [novaSenha, idUsuario], (err, results) => {
//         if (err) {
//             console.error('Erro ao atualizar a senha:', err);
//         } else {
//             if (results.affectedRows > 0) {
//                 console.log(`Senha do usuário com ID ${idUsuario} atualizada com sucesso.`);
//             } else {
//                 console.log(`Nenhum usuário encontrado com o ID ${idUsuario}.`);
//             }
//         }

//         connection.end();
//     });
// }