    import { API_URL } from './api.js';

    document.addEventListener("DOMContentLoaded", () => {
        // Botão de cadastro
        const btnCadastrar = document.getElementById("cad_produtos");
        const btnFecharPopup = document.getElementById("close_popUp");

        if (btnCadastrar) {
            btnCadastrar.addEventListener("click", async function (event) {
                event.preventDefault();

                const token = getToken(); 
                if (!token) return;

                const nome_produto = document.querySelector("input[name='nome_produto']").value.trim();
                const tag_produto = document.querySelector("input[name='tag_produto']").value.trim();
                const desc_produto = document.querySelector("input[name='desc_produto']").value.trim();
                const medicao_produto = document.querySelector("select[name='medicao']").value.trim();
                const valor_produto = document.querySelector("input[name='valor_unitario']").value.trim();
                const preco_custo = document.querySelector("input[name='preco_custo']").value.trim();
                const quantidade = document.querySelector("input[name='quantidade']").value.trim();

                if (!nome_produto || !desc_produto || !tag_produto || !medicao_produto || !valor_produto || !preco_custo || !quantidade) {
                    alert("Por favor, preencha todos os campos.");
                    return;
                }

                try {
                    const response = await fetch(`${API_URL}/api/itens`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-access-token": token
                        },
                        body: JSON.stringify({
                            nome: nome_produto,
                            tag: tag_produto,
                            descricao: desc_produto,
                            medida: medicao_produto,
                            precoVenda: parseFloat(valor_produto),
                            precoCusto: parseFloat(preco_custo),
                            quantidade: parseInt(quantidade)
                        })
                    });

                    const data = await response.json();
                    console.log("Resposta do servidor:", data);

                    if (response.ok && data?.sucesso) {
                        alert("Produto cadastrado com sucesso!");
                        document.getElementById("popUp").style.display = "none";
                        carregarItens(); // Recarrega a lista de produtos
                    } else {
                        alert(data?.mensagem || "Erro ao cadastrar o produto.");
                    }
                } catch (error) {
                    console.error("Erro ao enviar:", error);
                    alert("Falha na conexão com o servidor.");
                }
            });
        }

        if (btnFecharPopup) {
            btnFecharPopup.addEventListener("click", function () {
                document.getElementById("popUp").style.display = "none";
            });
        }

        // ===================== CARREGAMENTO DA TABELA ======================

        const tabelaEstoque = document.getElementById('tabela-estoqueProdutos');
        const btnBuscar = document.getElementById('btnBuscar');
        const btnRemover = document.getElementById('remover');
        const btnAtualizar = document.querySelector('.btn_editar');
        const btnNovo = document.querySelector('.btn_salvar');
        let token = localStorage.getItem('jwtToken');

        async function carregarItens(filtro = '', valor = '') {
            try {
                let url = `${API_URL}/api/itens`;
                if (filtro && valor) {
                    url += `?${filtro}=${encodeURIComponent(valor)}`;
                }

                const response = await fetch(url, {
                    headers: {
                        'x-access-token': token
                    }
                });

                if (!response.ok) throw new Error('Erro ao carregar itens');
                const itens = await response.json();
                preencherTabela(itens.data);
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao carregar itens do estoque');
            }
        }

        function preencherTabela(itens) {
            tabelaEstoque.innerHTML = '';
            itens.forEach(item => {
                const precoVenda = item.precoVenda != null ? Number(item.precoVenda) : 0;
                const quantidade = item.quantidade != null ? item.quantidade : 0;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="checkbox-item" data-id="${item.idProduto}"></td>
                    <td>${item.idProduto || '-'}</td>
                    <td>${item.tag || '-'}</td>
                    <td>${item.nome || '-'}</td>
                    <td>${item.descricao || '-'}</td>
                    <td>${item.medida || 'un'}</td>
                    <td>R$ ${precoVenda.toFixed(2)}</td>
                    <td>${quantidade}</td>
                `;
                tabelaEstoque.appendChild(row);
            });
        }

        if (btnBuscar) {
            btnBuscar.addEventListener('click', function () {
                const filtro = document.getElementById('coluna-filtro').value;
                const valorBusca = document.getElementById('buscar_pedidos').value;
                carregarItens(filtro, valorBusca);
            });
        }

        if (btnRemover) {
            btnRemover.addEventListener('click', async function() {
                const checkboxes = document.querySelectorAll('.checkbox-item:checked');
                
                if (checkboxes.length === 0) {
                    alert('Selecione pelo menos um item para remover');
                    return;
                }
                
                if (!confirm(`Deseja realmente remover ${checkboxes.length} item(ns)?`)) {
                    return;
                }
                
                try {
                    const ids = Array.from(checkboxes).map(cb => cb.getAttribute('data-id'));
                    
                    for (const id of ids) {
                        const response = await fetch(`${API_URL}/api/itens/${id}`, {
                            method: 'DELETE',
                            headers: {
                                'x-access-token': token
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Erro ao remover item ${id}`);
                        }
                    }
                    
                    alert('Itens removidos com sucesso!');
                    carregarItens(); // Recarrega a tabela
                } catch (error) {
                    console.error('Erro:', error);
                    alert('Erro ao remover itens com estoque positivo');
                }
            });
        }

        if (btnAtualizar) {
            btnAtualizar.addEventListener('click', function() {
                const checkboxes = document.querySelectorAll('.checkbox-item:checked');
                if (checkboxes.length !== 1) {
                    alert('Selecione um único item para atualizar.');
                    return;
                }

                const idProduto = checkboxes[0].getAttribute('data-id');
                abrirPopUp('atualizar', idProduto);
            });
        }

        if (btnNovo) {
            btnNovo.addEventListener('click', function() {
                abrirPopUp('novo');
            });
        }

        function abrirPopUp(tipo, idProduto = null) {
            console.log(`Abrir popup para ${tipo} com ID: ${idProduto}`);
            // Aqui você pode implementar abrir modal, editar ou cadastrar o produto.
        }

        carregarItens();
    });

    function getToken() {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
            alert("Sessão expirada. Faça login novamente.");
        }
        return token;
    }
