class FluxoDeCaixa {
    constructor(saldoInicial = 0) {
        this.saldoAtual = saldoInicial;
        this.valorEntrada = 0;
        this.valorSaida = 0;
        this.transacoes = []; // Histórico de transações
        this.dataAtualizacao = new Date();
    }

    registrarEntrada(valor, descricao, categoria = 'Receita', data = new Date()) {
        if (valor <= 0) {
            throw new Error('O valor da entrada deve ser positivo');
        }

        const transacao = {
            tipo: 'ENTRADA',
            valor,
            descricao,
            categoria,
            data,
            saldoAnterior: this.saldoAtual
        };

        this.valorEntrada += valor;
        this.saldoAtual += valor;
        transacao.novoSaldo = this.saldoAtual;
        
        this.transacoes.push(transacao);
        this.dataAtualizacao = new Date();
        
        return transacao;
    }

    registrarSaida(valor, descricao, categoria = 'Despesa', data = new Date()) {
        if (valor <= 0) {
            throw new Error('O valor da saída deve ser positivo');
        }

        const transacao = {
            tipo: 'SAÍDA',
            valor,
            descricao,
            categoria,
            data,
            saldoAnterior: this.saldoAtual
        };

        this.valorSaida += valor;
        this.saldoAtual -= valor;
        transacao.novoSaldo = this.saldoAtual;
        
        this.transacoes.push(transacao);
        this.dataAtualizacao = new Date();
        
        return transacao;
    }

    calcularSaldo() {
        return {
            saldoAtual: this.saldoAtual,
            totalEntradas: this.valorEntrada,
            totalSaidas: this.valorSaida,
            saldoInicial: this.saldoAtual - this.valorEntrada + this.valorSaida,
            dataAtualizacao: this.dataAtualizacao,
            quantidadeTransacoes: this.transacoes.length
        };
    }

    gerarRelatorioPeriodo(dataInicio, dataFim) {
        return this.transacoes.filter(transacao => {
            return transacao.data >= dataInicio && transacao.data <= dataFim;
        }).sort((a, b) => a.data - b.data);
    }

    obterHistoricoCompleto() {
        return [...this.transacoes].sort((a, b) => a.data - b.data);
    }
}

module.exports = FluxoDeCaixa;