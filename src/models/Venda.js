const {item} = require('./Item');
const HistoricoMovimentacoes = require('./HistoricoMovimentacoes');

class Venda {
    constructor(idVenda, dataVenda, itensVendidos = [], valorTotal = 0) {
        this.idVenda = idVenda;
        this.dataVenda = dataVenda;
        this.itensVendidos = itensVendidos;
        this.valorTotal = valorTotal;
        this.historicoTransacoes = new HistoricoMovimentacoes();
    }


    adicionarItem(item, quantidade, precoUnitario) {
        if (!item || !(item instanceof Item)) {
            throw new Error('Item inválido');
        }

        this.itensVendidos.push({
            item,
            quantidade,
            precoUnitario,
            subtotal: quantidade * precoUnitario
        });

        this.valorTotal = this.itensVendidos.reduce((total, item) => total + item.subtotal, 0);
    }

    gerarRelatorioEstoque() {
        return {
            dataVenda: this.dataVenda,
            idVenda: this.idVenda,
            itens: this.itensVendidos.map(item => ({
                idItem: item.item.id,
                nome: item.item.nome,
                quantidadeVendida: item.quantidade,
            })),
            totalItensVendidos: this.itensVendidos.reduce((total, item) => total + item.quantidade, 0)
        };
    }


    gerarRelatorioVendas() {
        return {
            idVenda: this.idVenda,
            dataVenda: this.dataVenda,
            itensVendidos: this.itensVendidos.map(item => ({
                idItem: item.item.id,
                nome: item.item.nome,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                subtotal: item.subtotal
            })),
            valorTotal: this.valorTotal,
            quantidadeItens: this.itensVendidos.length,
            quantidadeTotal: this.itensVendidos.reduce((total, item) => total + item.quantidade, 0)
        };
    }

    gerarRelatorioFinanceiro() {
        return {
            idVenda: this.idVenda,
            dataVenda: this.dataVenda,
            valorTotal: this.valorTotal,
            transacoes: this.historicoTransacoes.consultarMovimentacoes(),
            formaPagamento: this.formaPagamento || 'Não especificada',
            parcelamento: this.parcelamento || 'À vista'
        };
    }


    registrarTransacao(tipoMovimentacao, valor, usuario, data = new Date().toISOString().split('T')[0]) {
        this.historicoTransacoes.registrarMovimentacao(
            data,
            tipoMovimentacao,
            0, // tipoOperacao (pode ser ajustado conforme necessidade)
            1, // quantidade (1 transação)
            valor,
            usuario
        );
    }
}

module.exports = Venda;