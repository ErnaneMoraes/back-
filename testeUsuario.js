const Usuario = require('./src/models/Usuario');

// Função para testar a classe Usuario
async function testarUsuario() {
    const listaUsuarios = [
        { idUsuario: 1, nome: 'João Silva', login: 'joao.silva', senha: 'senha123', nivelAcesso: 'admin' },
        { idUsuario: 2, nome: 'Maria Souza', login: 'maria.souza', senha: 'senha456', nivelAcesso: 'editor' }
    ];

    // Testar validação de login existente
    //const loginExistente = Usuario.validarLoginExistente('joao.silva', listaUsuarios);
    //console.log('Login já existe?', loginExistente ? 'Sim' : 'Não');

    // Criar um novo usuário no banco de dados
    const novoUsuario = new Usuario(null, 'Ernane', 'arroba', 'Unileste', '1');

    // Testar o método criarUsuario
    novoUsuario.criarUsuario(novoUsuario.nome, novoUsuario.login, novoUsuario.senha, novoUsuario.nivelAcesso);

    // Testar autenticação de usuário
    //const autenticado = novoUsuario.autenticarUsuario('carlos.oliveira', 'senha789');
    //console.log('Usuário autenticado?', autenticado ? 'Sim' : 'Não');

    // Testar definição de permissões
    // novoUsuario.definirPermissoes();
}

testarUsuario();