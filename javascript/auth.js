export function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        // Se não tiver token, redireciona para o login
        window.location.href = 'login.html'; // Ajuste o caminho se necessário
    }
}
