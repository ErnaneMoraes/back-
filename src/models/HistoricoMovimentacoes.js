const { usuario } = require('./Usuario');

class HistoricoMovimentacoes {
    constructor() {
        this.movimentacoes = [];
    }


    registrarMovimentacao(data, tipoMovimentacao, tipoOperacao, quantidade, valor, usuarioResponsavel) {
        if (!usuarioResponsavel || !usuarioResponsavel.id) {
            throw new Error('Usuário responsável inválido ou não instanciado');
        }

        const movimentacao = {
            data,
            tipoMovimentacao,
            tipoOperacao,
            quantidade,
            valor,
            usuarioResponsavel
        };

        this.movimentacoes.push(movimentacao);
        return movimentacao;
    }


    consultarMovimentacoes(filtros = {}) {
        let resultado = [...this.movimentacoes];

        if (filtros.data) {
            resultado = resultado.filter(m => m.data === filtros.data);
        }
        if (filtros.tipoMovimentacao) {
            resultado = resultado.filter(m => m.tipoMovimentacao === filtros.tipoMovimentacao);
        }
        if (filtros.tipoOperacao !== undefined) {
            resultado = resultado.filter(m => m.tipoOperacao === filtros.tipoOperacao);
        }
        if (filtros.usuarioId) {
            resultado = resultado.filter(m => m.usuarioResponsavel.id === filtros.usuarioId);
        }
        if (filtros.valorMinimo) {
            resultado = resultado.filter(m => m.valor >= filtros.valorMinimo);
        }
        if (filtros.valorMaximo) {
            resultado = resultado.filter(m => m.valor <= filtros.valorMaximo);
        }

        return resultado;
    }
}

module.exports = HistoricoMovimentacoes;