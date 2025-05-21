import { API_URL } from './api.js';
let linhaEmEdicao = null;

document.getElementById("open_popUp").addEventListener("click", async function (event) {
    event.preventDefault();

    const token = getToken();
    if (!token) return;

    const nome_usuario = document.querySelector("input[name='nome_usuario']").value.trim();
    const login = document.querySelector("input[name='login']").value.trim();
    const senha = document.querySelector("input[name='senha']").value.trim();
    const nivel_acesso = document.querySelector("select[name='medicao']").value;

    if (!nome_usuario || !login || !senha || !nivel_acesso) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-access-token": token
            },
            body: JSON.stringify({
                nome: nome_usuario,
                login: login,
                senha: senha,
                nivelAcesso: parseInt(nivel_acesso)
            })
        });

        const data = await response.json();
        console.log("Resposta do servidor:", data);

        if (response.ok) {
            if (data?.sucesso) {
                alert("Usuário cadastrado com sucesso!");
                document.getElementById("popUp").style.display = "none";
                fetchUsuarios();
            } else {
                alert(data?.mensagem || "Erro ao cadastrar usuário.");
            }
        } else {
            alert(data?.mensagem || "Erro ao cadastrar usuário.");
        }

    } catch (error) {
        console.error("Erro ao enviar:", error);
        alert("Falha na conexão com o servidor.");
    }
});

document.getElementById("close_popUp").addEventListener("click", function () {
    document.getElementById("popUp").style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
    fetchUsuarios();
});

function getToken() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
    }
    return token;
}

function fetchUsuarios() {
    const token = getToken();
    if (!token) return;

    fetch(`${API_URL}/usuarios`, {
        headers: {
            "x-access-token": token
        }
    })
    .then(response => response.json())
    .then(usuarios => {
        const tabela = document.getElementById("tabela-usuarios");
        tabela.innerHTML = "";

        usuarios.forEach(usuario => {
            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${usuario.ID_USUARIO_PK}</td>
                <td contenteditable="false">${usuario.NOME}</td>
                <td contenteditable="false">${usuario.LOGIN}</td>
                <td contenteditable="false" class="senha">*****</td>
                <td contenteditable="false">${nivelTexto(usuario.NIVEL_ACESSO)}</td>
                <td>
                    <button class="editar" onclick="editarLinha(this)"><i class="fa fa-edit"></i></button>
                    <button class="salvar" onclick="salvarLinha(this)" style="display:none;"><i class="fa fa-check"></i></button>
                    <button class="excluir" onclick="excluirLinha(this)"><i class="fa fa-trash"></i></button>
                </td>
            `;
            tabela.appendChild(linha);
        });
    })
    .catch(error => console.error("Erro ao buscar usuários:", error));
}

function nivelTexto(nivel) {
    switch (nivel) {
        case 1: return "Administrador";
        case 2: return "Supervisor";
        case 3: return "Vendedor";
        default: return "Desconhecido";
    }
}

function textoParaNivel(texto) {
    switch (texto.toLowerCase()) {
        case "administrador": return 1;
        case "supervisor": return 2;
        case "vendedor": return 3;
        default: return null;
    }
}

function excluirLinha(botao) {
    const linha = botao.closest("tr");
    const id = linha.children[0].textContent;
    const token = getToken();
    if (!token) return;

    if (confirm("Tem certeza que deseja excluir este usuário?")) {
        fetch(`${API_URL}/usuarios/${id}`, {
            method: "DELETE",
            headers: {
                "x-access-token": token
            }
        })
        .then(response => {
            return response.json().then(data => {
                if (!response.ok) throw new Error(data?.mensagem || "Erro ao excluir usuário.");
                linha.remove();
            });
        })
        .catch(error => {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir usuário.");
        });
    }
}
window.excluirLinha = excluirLinha;

function editarLinha(botao) {
    const novaLinha = botao.closest("tr");

    if (linhaEmEdicao && linhaEmEdicao !== novaLinha) {
        cancelarEdicao(linhaEmEdicao);
    }

    linhaEmEdicao = novaLinha;

    for (let i = 1; i <= 3; i++) {
        novaLinha.children[i].setAttribute("contenteditable", "true");
    }
    
    // Campo de senha
    novaLinha.children[3].textContent = "[Digite nova senha]";
    
    // Substitui o campo de nível por um dropdown
    const nivelAtual = novaLinha.children[4].textContent.trim();
    const select = document.createElement("select");
    ["Administrador", "Supervisor", "Vendedor"].forEach(opcao => {
        const option = document.createElement("option");
        option.value = opcao;
        option.textContent = opcao;
        if (opcao === nivelAtual) option.selected = true;
        select.appendChild(option);
    });
    novaLinha.children[4].innerHTML = "";
    novaLinha.children[4].appendChild(select);
    

    novaLinha.querySelector(".editar").style.display = "none";
    novaLinha.querySelector(".salvar").style.display = "inline-block";

    const excluirBtn = novaLinha.querySelector(".excluir");
    excluirBtn.innerHTML = `<i class="fa fa-times"></i>`;
    excluirBtn.classList.remove("excluir");
    excluirBtn.classList.add("cancelar");
    excluirBtn.setAttribute("onclick", "cancelarEdicao(this.closest('tr'))");
}
window.editarLinha = editarLinha;

function cancelarEdicao(linha) {
    if (!linha) return;

    for (let i = 1; i <= 4; i++) {
        linha.children[i].setAttribute("contenteditable", "false");
    }

    linha.children[3].textContent = "*****";

    linha.querySelector(".editar").style.display = "inline-block";
    linha.querySelector(".salvar").style.display = "none";

    const cancelarBtn = linha.querySelector(".cancelar");
    if (cancelarBtn) {
        cancelarBtn.innerHTML = `<i class="fa fa-trash"></i>`;
        cancelarBtn.classList.remove("cancelar");
        cancelarBtn.classList.add("excluir");
        cancelarBtn.setAttribute("onclick", "excluirLinha(this)");
    }

    if (linhaEmEdicao === linha) {
        linhaEmEdicao = null;
    }
}
window.cancelarEdicao = cancelarEdicao;

function salvarLinha(botao) {
    const linha = botao.closest("tr");
    const id = linha.children[0].textContent;
    const nome = linha.children[1].textContent.trim();
    const login = linha.children[2].textContent.trim();
    const senhaCampo = linha.children[3].textContent.trim();
    const nivelTextoCampo = linha.children[4].querySelector("select")?.value?.trim();
    const token = getToken();
    if (!token) return;

    if (!nome || !login || !nivelTextoCampo) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    const nivelAcesso = textoParaNivel(nivelTextoCampo);
    if (!nivelAcesso) {
        alert("Nível de acesso inválido. Use: Administrador, Supervisor ou Vendedor.");
        return;
    }

    const payload = { nome, login, nivelAcesso };

    if (senhaCampo && senhaCampo !== "*****" && senhaCampo !== "[Digite nova senha]") {
        payload.senha = senhaCampo;
    }

    fetch(`${API_URL}/usuarios/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "x-access-token": token
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json().then(data => {
        if (!response.ok) throw new Error(data?.mensagem || "Erro ao salvar usuário.");

        for (let i = 1; i <= 4; i++) {
            linha.children[i].setAttribute("contenteditable", "false");
        }

        linha.children[3].textContent = "*****";
        linha.children[4].textContent = nivelTexto(nivelAcesso);

        linha.querySelector(".editar").style.display = "inline-block";
        linha.querySelector(".salvar").style.display = "none";

        const cancelarBtn = linha.querySelector(".cancelar");
        if (cancelarBtn) {
            cancelarBtn.innerHTML = `<i class="fa fa-trash"></i>`;
            cancelarBtn.classList.remove("cancelar");
            cancelarBtn.classList.add("excluir");
            cancelarBtn.setAttribute("onclick", "excluirLinha(this)");
        }

        linhaEmEdicao = null;
        alert("Usuário atualizado com sucesso!");
    }))
    .catch(error => {
        console.error("Erro ao salvar:", error);
        alert(error.message || "Erro ao salvar alterações.");
    });
}
window.salvarLinha = salvarLinha;