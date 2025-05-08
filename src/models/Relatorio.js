class Relatorio {
    constructor(idRelatorio, tipoRelatorio, periodo) {
        this.idRelatorio = idRelatorio;
        this.tipoRelatorio = tipoRelatorio;
        this.periodo = periodo;
        this.dados = '';
        this.dataGeracao = new Date().toISOString();
    }


    gerarRelatorioEstoque(estoques) {
        this.tipoRelatorio = 'ESTOQUE';
        
        const dadosFormatados = estoques.map(estoque => ({
            idEstoque: estoque.idEstoque,
            localizacao: estoque.localizacao,
            item: estoque.item.nome,
            quantidadeAtual: estoque.quantidade,
            ultimaAtualizacao: estoque.historico.length > 0 
                ? estoque.historico[estoque.historico.length - 1].data 
                : 'Nunca'
        }));

        this.dados = JSON.stringify({
            cabecalho: `Relatório de Estoque - Período: ${this.periodo}`,
            dataGeracao: this.dataGeracao,
            totalItens: estoques.length,
            itens: dadosFormatados,
            resumo: {
                totalEmEstoque: estoques.reduce((sum, e) => sum + e.quantidade, 0),
                itensComEstoqueBaixo: dadosFormatados.filter(i => i.quantidadeAtual < 10).length
            }
        });

        return this;
    }

    gerarRelatorioVendas(vendas) {
        this.tipoRelatorio = 'VENDAS';
        
        const dadosFormatados = vendas.map(venda => ({
            idVenda: venda.idVenda,
            dataVenda: venda.dataVenda,
            quantidadeItens: venda.itensVendidos.reduce((sum, item) => sum + item.quantidade, 0),
            valorTotal: venda.valorTotal,
            itens: venda.itensVendidos.map(item => ({
                nome: item.item.nome,
                quantidade: item.quantidade,
                valorUnitario: item.precoUnitario
            }))
        }));

        this.dados = JSON.stringify({
            cabecalho: `Relatório de Vendas - Período: ${this.periodo}`,
            dataGeracao: this.dataGeracao,
            totalVendas: vendas.length,
            vendas: dadosFormatados,
            resumo: {
                valorTotalPeriodo: vendas.reduce((sum, v) => sum + v.valorTotal, 0),
                mediaDiaria: vendas.length > 0 
                    ? vendas.reduce((sum, v) => sum + v.valorTotal, 0) / vendas.length 
                    : 0,
                produtoMaisVendido: this._calcularProdutoMaisVendido(vendas)
            }
        });

        return this;
    }

    gerarRelatorioFinanceiro(vendas, movimentacoes) {
        this.tipoRelatorio = 'FINANCEIRO';
        
        const totalVendas = vendas.reduce((sum, v) => sum + v.valorTotal, 0);
        const transacoes = movimentacoes.consultarMovimentacoes();

        this.dados = JSON.stringify({
            cabecalho: `Relatório Financeiro - Período: ${this.periodo}`,
            dataGeracao: this.dataGeracao,
            receitas: {
                totalVendas,
                outrasReceitas: transacoes
                    .filter(t => t.tipoMovimentacao === 'RECEITA')
                    .reduce((sum, t) => sum + t.valor, 0)
            },
            despesas: transacoes
                .filter(t => t.tipoMovimentacao === 'DESPESA')
                .reduce((sum, t) => sum + t.valor, 0),
            transacoes: transacoes.map(t => ({
                data: t.data,
                tipo: t.tipoMovimentacao,
                valor: t.valor,
                responsavel: t.usuarioResponsavel.nome
            })),
            saldo: totalVendas - transacoes
                .filter(t => t.tipoMovimentacao === 'DESPESA')
                .reduce((sum, t) => sum + t.valor, 0)
        });

        return this;
    }

    _calcularProdutoMaisVendido(vendas) {
        const produtos = {};

        vendas.forEach(venda => {
            venda.itensVendidos.forEach(item => {
                const nome = item.item.nome;
                produtos[nome] = (produtos[nome] || 0) + item.quantidade;
            });
        });

        if (Object.keys(produtos).length === 0) {
            return { nome: 'Nenhum', quantidade: 0 };
        }

        const maisVendido = Object.entries(produtos).reduce((a, b) => a[1] > b[1] ? a : b);
        return { nome: maisVendido[0], quantidade: maisVendido[1] };
    }


    toJSON() {
        return {
            idRelatorio: this.idRelatorio,
            tipoRelatorio: this.tipoRelatorio,
            periodo: this.periodo,
            dataGeracao: this.dataGeracao,
            dados: JSON.parse(this.dados)
        };
    }
}

module.exports = Relatorio;