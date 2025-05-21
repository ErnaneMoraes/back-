let produtosDisponiveis = [];
let clientesDisponiveis = [];

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        inicializarAplicacao();
    }, 100);
});

async function inicializarAplicacao() {
    try {
        await Promise.all([
            carregarClientes(),
            carregarProdutos()
        ]);
        inicializarMascaras();
        inicializarEventos();
    } catch (error) {
        console.error('Erro na inicialização:', error);
        mostrarErro('Erro ao carregar dados iniciais');
    }
}

function inicializarMascaras() {
    const $ = window.jQuery;
    if (!$) return;

    $('input[name="num_celular"]').mask('(00) 0 0000-0000');
    $('input[name="cpf_ou_cnpj"]').mask('000.000.000-00', {reverse: true});
    $('input[name="CEP"]').mask('00000-000');
    $('input[name="UF"]').mask('AA');
    $('input[name^="desconto"], input[name^="subtotal"], input[name="total"]').mask('#.##0,00', {reverse: true});
}

function inicializarEventos() {
    document.querySelector('.add_produto')?.addEventListener('click', adicionarProduto);
    
    document.addEventListener('input', function(e) {
        if (e.target.matches('.quantidade-produto, .desconto-produto, .select-produto')) {
            calcularSubtotal(e.target);
        }
    });
}

async function carregarClientes() {
    try {
        const response = await fetch('http://localhost:8080/api/pessoas', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar clientes');
        
        const data = await response.json();
        clientesDisponiveis = data.data || [];
        configurarAutocompleteClientes();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        throw error;
    }
}

function configurarAutocompleteClientes() {
    const inputCliente = document.querySelector('input[name="nome_cliente"]');
    const datalist = document.getElementById('clientes-list');
    
    if (!inputCliente || !datalist) return;
    
    datalist.innerHTML = '';
    
    clientesDisponiveis.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.NOME;
        option.dataset.id = cliente.ID_PESSOA_PK;
        option.dataset.cpf = cliente.CPF_CNPJ;
        option.dataset.celular = cliente.CELULAR;
        option.dataset.endereco = `${cliente.RUA}, ${cliente.NUMERO}, ${cliente.CIDADE}/${cliente.UF}`;
        datalist.appendChild(option);
    });
    
    inputCliente.addEventListener('change', function() {
        const selectedOption = document.querySelector(`#clientes-list option[value="${this.value}"]`);
        if (selectedOption) {
            preencherDadosCliente(selectedOption);
        }
    });
}

function preencherDadosCliente(option) {
    const campos = {
        'cpf_ou_cnpj': formatarDocumento(option.dataset.cpf),
        'num_celular': formatarTelefone(option.dataset.celular)
    };

    const endereco = option.dataset.endereco?.split(', ') || [];
    if (endereco.length >= 3) {
        campos['nome_rua'] = endereco[0];
        campos['numero_casa'] = endereco[1];
        const cidadeUf = endereco[2].split('/');
        campos['cidade'] = cidadeUf[0];
        campos['UF'] = cidadeUf[1];
    }

    Object.entries(campos).forEach(([name, value]) => {
        const input = document.querySelector(`input[name="${name}"]`);
        if (input) input.value = value;
    });
}

async function carregarProdutos() {
    try {
        const response = await fetch('http://localhost:8080/api/itens', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        
        const data = await response.json();
        produtosDisponiveis = data.data || [];
        atualizarSelectProdutos();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        throw error;
    }
}

function atualizarSelectProdutos() {
    document.querySelectorAll('.select-produto').forEach(select => {
        select.innerHTML = '<option value="">Selecione um produto</option>';
        console.log('Produto recebido:', produtosDisponiveis);
        produtosDisponiveis.forEach(produto => {
            const option = document.createElement('option');
            option.value = produto.idProduto;
            option.textContent = `${produto.nome} (${formatarMoeda(produto.precoVenda)})`;
            option.dataset.preco = produto.precoVenda;
            select.appendChild(option);
        });
    });
}

function adicionarProduto() {
    const container = document.getElementById('produtos-container');
    if (!container) return;

    const novoProduto = document.createElement('div');
    novoProduto.className = 'info-produtos';
    novoProduto.innerHTML = `
        <div class="campo-cad">
            <label>Produto</label>
            <select name="produto[]" class="select-produto" required>
                <option value="">Selecione um produto</option>
                ${produtosDisponiveis.map(produto => `
                    <option value="${produto.idProduto}" data-preco="${produto.precoVenda}">
                        ${produto.NOME} (${formatarMoeda(produto.precoVenda)})
                    </option>
                `).join('')}
            </select>
        </div>
        <div class="campo-cad">
            <label>Quantidade</label>
            <input type="number" name="quantidade[]" placeholder="Ex.: 10 UN" min="1" class="quantidade-produto">
        </div>
        <div class="campo-cad">
            <label>Desconto</label>
            <input type="text" name="desconto[]" placeholder="Ex.: R$ 5.00,00" class="desconto-produto">
        </div>
        <div class="campo-cad">
            <label>Subtotal</label>
            <input type="text" name="subtotal[]" placeholder="Ex.: R$ 10.00,00" readonly class="subtotal-produto">
        </div>
        <div class="container_novo_produto">
            <button type="button" class="remover_produto" onclick="removerProduto(this)">
                <img src="assets/remover_produto.png" alt="Remover produto" />
            </button>
        </div>
    `;
    container.appendChild(novoProduto);
}

function removerProduto(botao) {
    botao.closest('.info-produtos')?.remove();
    calcularTotalPedido();
}

function calcularSubtotal(elemento) {
    const linha = elemento.closest('.info-produtos');
    if (!linha) return;

    const select = linha.querySelector('.select-produto');
    const quantidadeInput = linha.querySelector('.quantidade-produto');
    const descontoInput = linha.querySelector('.desconto-produto');
    const subtotalInput = linha.querySelector('.subtotal-produto');

    if (!select || !quantidadeInput || !descontoInput || !subtotalInput) return;

    const quantidade = parseFloat(quantidadeInput.value) || 0;
    const desconto = parseFloat(descontoInput.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const precoUnitario = select.value ? parseFloat(select.selectedOptions[0]?.dataset.preco) : 0;
    
    const subtotal = (quantidade * precoUnitario) - desconto;
    subtotalInput.value = formatarMoeda(subtotal);
    
    calcularTotalPedido();
}

function calcularTotalPedido() {
    let total = 0;
    document.querySelectorAll('.subtotal-produto').forEach(input => {
        const valor = parseFloat(input.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        total += valor;
    });
    
    const totalInput = document.querySelector('input[name="total"]');
    if (totalInput) {
        totalInput.value = formatarMoeda(total);
    }
}

function validarPedido() {
    const cliente = document.querySelector('input[name="nome_cliente"]')?.value;
    if (!cliente) {
        mostrarErro('Selecione um cliente');
        return;
    }

    let temProdutosValidos = false;
    document.querySelectorAll('.select-produto').forEach(select => {
        if (select.value) temProdutosValidos = true;
    });

    if (!temProdutosValidos) {
        mostrarErro('Adicione pelo menos um produto');
        return;
    }

    abrirPopUp();
}

function abrirPopUp() {
    const popUp = document.getElementById('popUp');
    if (popUp) popUp.style.display = 'flex';
}

function fecharPopUp() {
    const popUp = document.getElementById('popUp');
    if (popUp) popUp.style.display = 'none';
}

async function confirmarPedido() {
    const popUp = document.getElementById('popUp');
    const btnConfirmar = popUp?.querySelector('.btn_salvar');
    
    try {
        if (btnConfirmar) {
            btnConfirmar.disabled = true;
            btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        }
        
        const resultado = await emitirPedido();
        mostrarSucesso(`Pedido criado com sucesso!`);
        
        const form = document.getElementById('formPedido');
        if (form) form.reset();
        
    } catch (error) {
        console.error('Erro ao confirmar pedido:', error);
        mostrarErro(error.message);
    } finally {
        if (btnConfirmar) {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Confirmar';
        }
        if (popUp) popUp.style.display = 'none';
    }
}

async function emitirPedido() {
    try {
        // 1. Verifica se o token existe
        const token = localStorage.getItem('token');
        // if (!token) {
        //     throw new Error('Usuário não autenticado. Faça login novamente.');
        // }

        // 2. Valida o formulário
        const form = document.getElementById('formPedido');
        if (!form) throw new Error('Formulário não encontrado.');

        // 3. Prepara os dados do pedido
        const clienteInput = form.querySelector('input[name="nome_cliente"]');
        const clienteOption = document.querySelector(`#clientes-list option[value="${clienteInput.value}"]`);
        // if (!clienteOption) throw new Error('Selecione um cliente válido.');

        const itens = Array.from(document.querySelectorAll('.info-produtos'))
        .map(linha => {
            const select = linha.querySelector('.select-produto');
            const quantidadeInput = linha.querySelector('.quantidade-produto');
    
            if (!select || !quantidadeInput || !select.selectedOptions[0]) {
                console.warn('Elemento select ou quantidade não encontrado ou inválido em uma linha.');
                return null; // Ignora essa linha
            }
    
            return {
                idProduto: select.value,
                quantidade: parseFloat(quantidadeInput.value),
                precoUnitario: parseFloat(select.selectedOptions[0].dataset.preco)
            };
        })
        .filter(item => item && item.idProduto && !isNaN(item.quantidade) && item.quantidade > 0);
    

        if (itens.length === 0) throw new Error('Adicione pelo menos um produto válido.');

        // 4. Faz a chamada à API
        const response = await fetch('http://localhost:8080/api/pedidos', {  
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                idPessoa: clienteOption.dataset.id,
                listaItens: itens,
                formaPgto: form.querySelector('select[name="forma_pagamento"]').value,
                parcelas: parseInt(form.querySelector('input[name="parcelas"]').value) || 1
            })
        });

        // 5. Verifica se a resposta é JSON (evita o erro "Unexpected token '<'")
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const errorText = await response.text();
            console.error('Resposta não-JSON do servidor:', errorText);
            throw new Error('Resposta inválida do servidor. Tente novamente.');
        }

        const resultado = await response.json();

        // 6. Verifica se houve erro na API (mesmo com status 200)
        if (!response.ok || resultado.error) {
            throw new Error(resultado.message || 'Erro ao registrar pedido.');
        }

        // 7. Sucesso!
        alert(`Pedido criado com sucesso!`);
        form.reset();

    } catch (error) {
        console.error('Erro no emitir pedido:', error);
        alert('Erro: ' + error.message);
    }
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

function formatarMoeda(valor) {
    return parseFloat(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function mostrarErro(mensagem) {
    alert(mensagem); 
}

function mostrarSucesso(mensagem) {
    alert(mensagem); 
}

window.removerProduto = removerProduto;
window.validarPedido = validarPedido;
window.confirmarPedido = confirmarPedido;
window.fecharPopUp = fecharPopUp;

//olá