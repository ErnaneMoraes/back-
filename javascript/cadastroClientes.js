import { API_URL } from './api.js';
const token = getToken();


document.addEventListener('DOMContentLoaded', function() {
    // Corrigido para 'jwtToken'

if (!token) {
    alert("Sessão expirada. Faça login novamente.");
    window.location.href = "index.html";
    return;
}
    inicializarMascaras();
    inicializarEventos();
    carregarClientes();
});

function getToken() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
    }
    return token;
}

// Máscaras para os campos
function inicializarMascaras() {
    $('input[name="num_celular"]').mask('(00) 0 0000-0000');
    $('input[name="cpf_ou_cnpj"]').mask('000.000.000-00', {reverse: true});
    $('input[name="cep"]').mask('00000-000');
    $('input[name="UF"]').mask('AA');
}

function inicializarEventos() {
    document.getElementById('salvarClientes').addEventListener('click', salvarCliente);
    
    $('input[name="cpf_ou_cnpj"]').on('keyup', function() {
        const valor = $(this).cleanVal();
        if (valor.length > 11) {
            $(this).mask('00.000.000/0000-00', {reverse: true});
        } else {
            $(this).mask('000.000.000-00', {reverse: true});
        }
    });
}

async function carregarClientes() {
    try {
        const token = localStorage.getItem('jwtToken');
        console.log('Token JWT:', token); // Verifique se o token existe
        
        if (!token) {
            throw new Error('Token de autenticação não encontrado. Faça login novamente.');
        }

        const response = await fetch(`${API_URL}/api/pessoas`, {
            headers: {
                'x-access-token': token // Verifique se o nome do cabeçalho está correto (pode ser 'Authorization' em alguns casos)
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na API:', errorData);
            throw new Error(errorData.message || 'Erro ao carregar clientes');
        }
        
        const { data } = await response.json();
        preencherTabelaClientes(data);
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message); // Mostra mensagens de erro específicas
    }
}

function preencherTabelaClientes(clientes) {
    const tbody = document.getElementById('table-clientes');
    tbody.innerHTML = '';
    
    clientes.forEach(cliente => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${cliente.ID_PESSOA_PK}</td>
            <td>${cliente.NOME}</td>
            <td>${formatarTelefone(cliente.CELULAR)}</td>
            <td>${formatarDocumento(cliente.CPF_CNPJ)}</td>
            <td>${cliente.RUA}</td>
            <td>${cliente.CEP ? cliente.CEP : 'N/A'}</td> <!-- Verifica e substitui 'null' por 'N/A' -->
            <td>${cliente.NUMERO}</td>            
            <td>${cliente.CIDADE}</td>
            <td>${cliente.UF}</td>
            <td class="acoes">
                <button class="btn-editar" onclick="editarCliente(${cliente.ID_PESSOA_PK})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-excluir" onclick="excluirCliente(${cliente.ID_PESSOA_PK})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}



function formatarDocumento(doc) {
    if (!doc) return '';
    const numeros = doc.replace(/\D/g, '');
    
    if (numeros.length === 11) {
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numeros.length === 14) {
        return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
}

function formatarTelefone(telefone) {
    if (!telefone) return '';
    const numeros = telefone.replace(/\D/g, '');
    
    if (numeros.length === 11) {
        return numeros.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
    } else if (numeros.length === 10) {
        return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
}

async function salvarCliente() {
    fecharPopUpClientes();
    
    const form = document.querySelector('form');
    const formData = {
        nome: form.nome_cliente.value,
        celular: $(form.num_celular).cleanVal(),
        cpfCnpj: $(form.cpf_ou_cnpj).cleanVal(),
        rua: form.nome_rua.value,
        numero: form.numero_casa.value,
        bairro: 'N/A', // Seu banco não tem bairro
        cidade: form.cidade.value,
        uf: form.UF.value.toUpperCase(),
        cep: $(form.cep).cleanVal()  // Limpa o valor do CEP
    };
    
    try {
        const response = await fetch(`${API_URL}/api/pessoas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('jwtToken')
            },
            body: JSON.stringify(formData)
        });
        
        const resultado = await response.json();
        
        if (!response.ok) {
            throw new Error(resultado.message || 'Erro ao salvar cliente');
        }
        
        alert('Cliente cadastrado com sucesso!');
        form.reset();
        carregarClientes();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar cliente: ' + error.message);
    }
}

async function editarCliente(id) {
    try {
        const response = await fetch(`${API_URL}/api/pessoas/${id}`, {
            headers: {
                'x-access-token': localStorage.getItem('token')
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar dados do cliente');
        }
        
        const { data } = await response.json();
        preencherFormularioEdicao(data);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao editar cliente: ' + error.message);
    }
}

function preencherFormularioEdicao(cliente) {
    const form = document.querySelector('form');
    
    form.nome_cliente.value = cliente.NOME;
    form.num_celular.value = cliente.CELULAR ? formatarTelefone(cliente.CELULAR) : '';
    form.cpf_ou_cnpj.value = formatarDocumento(cliente.CPF_CNPJ);
    form.nome_rua.value = cliente.RUA;
    form.numero_casa.value = cliente.NUMERO;
    form.cidade.value = cliente.CIDADE;
    form.UF.value = cliente.UF;
    
    const btnSalvar = document.getElementById('btn-salvar-cliente');
    btnSalvar.textContent = 'Atualizar';
    btnSalvar.onclick = function() {
        abrirPopUpClientes('atualizar');
    };
    
    form.dataset.idEdicao = cliente.ID_PESSOA_PK;
}

async function atualizarCliente() {
    fecharPopUpClientes();
    
    const form = document.querySelector('form');
    const id = form.dataset.idEdicao;
    
    const formData = {
        nome: form.nome_cliente.value,
        celular: $(form.num_celular).cleanVal(),
        cpfCnpj: $(form.cpf_ou_cnpj).cleanVal(),
        rua: form.nome_rua.value,
        numero: form.numero_casa.value,
        bairro: 'N/A',
        cidade: form.cidade.value,
        uf: form.UF.value.toUpperCase()
    };
    
    try {
        const response = await fetch(`${API_URL}/api/pessoas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('token')
            },
            body: JSON.stringify(formData)
        });
        
        const resultado = await response.json();
        
        if (!response.ok) {
            throw new Error(resultado.message || 'Erro ao atualizar cliente');
        }
        
        alert('Cliente atualizado com sucesso!');
        resetarFormulario();
        carregarClientes();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao atualizar cliente: ' + error.message);
    }
}

async function excluirCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/pessoas/${id}`, {
            method: 'DELETE',
            headers: {
                'x-access-token': localStorage.getItem('token')
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao excluir cliente');
        }
        
        alert('Cliente excluído com sucesso!');
        carregarClientes();
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir cliente: ' + error.message);
    }
}

function resetarFormulario() {
    const form = document.querySelector('form');
    form.reset();
    
    const btnSalvar = document.getElementById('btn-salvar-cliente');
    btnSalvar.textContent = 'Salvar';
    btnSalvar.onclick = function() {
        abrirPopUpClientes();
    };
    
    if (form.dataset.idEdicao) {
        delete form.dataset.idEdicao;
    }
}

function abrirPopUpClientes(modo = 'cadastrar') {
    const popup = document.getElementById('popUpClientes');

    const antigoBtn = document.getElementById('salvarClientes');
    const novoBtn = antigoBtn.cloneNode(true); // clona sem eventos
    novoBtn.id = 'salvarClientes';
    antigoBtn.parentNode.replaceChild(novoBtn, antigoBtn);

    // atualiza texto e ação conforme o modo
    if (modo === 'atualizar') {
        novoBtn.onclick = atualizarCliente;
        popup.querySelector('p').textContent = 'Você está prestes a atualizar um cliente. Deseja continuar?';
    } else {
        novoBtn.onclick = salvarCliente;
        popup.querySelector('p').textContent = 'Você está prestes a cadastrar um cliente. Deseja continuar?';
    }

    popup.style.display = 'flex';
}

// function abrirPopUpClientes(modo = 'cadastrar') {
//     const popup = document.getElementById('popUpClientes');
//     const btnSalvar = document.getElementById('salvarClientes');
    
//     if (modo === 'atualizar') {
//         btnSalvar.onclick = atualizarCliente;
//         popup.querySelector('p').textContent = 'Você está prestes a atualizar um cliente. Deseja continuar?';
//     } else {
//         btnSalvar.onclick = salvarCliente;
//         popup.querySelector('p').textContent = 'Você está prestes a cadastrar um cliente. Deseja continuar?';
//     }
    
//     popup.style.display = 'flex';
// }

function fecharPopUpClientes() {
    document.getElementById('popUpClientes').style.display = 'none';
}

// Exportar funções para uso global
window.editarCliente = editarCliente;
window.excluirCliente = excluirCliente;
window.abrirPopUpClientes = abrirPopUpClientes;
window.fecharPopUpClientes = fecharPopUpClientes;