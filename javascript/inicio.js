import { API_URL } from './api.js';

document.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("jwtToken"); // Certifique-se de que está pegando do localStorage

    if (!token) {
        alert("Acesso negado! Faça login primeiro.");
        window.location.href = "index.html"; // Redireciona para login
        return;
    }

    try {
        const response = await fetch(`${API_URL}/verify-token`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Token inválido");
        }

        console.log("Token verificado com sucesso.");
    } catch (error) {
        alert("Sessão inválida ou expirada. Faça login novamente.");
        localStorage.removeItem("jwtToken"); // Remove o token inválido
        window.location.href = "index.html"; // Redireciona para login
    }
});
