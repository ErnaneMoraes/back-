class HistoricoPedido {
    constructor(idHistoricoPedido, data, status, usuarioResponsavel) {
        this.idHistoricoPedido = idHistoricoPedido; 
        this.data = data; 
        this.status = status; 
        this.usuarioResponsavel = usuarioResponsavel; 
    }

    registrarMudancaStatus(novoStatus) {
        this.status = novoStatus;
        console.log(`Mudança de status registrada para "${this.status}" pelo usuário "${this.usuarioResponsavel.nome}".`);
    }

    consultarHistoricoPedido() {
        console.log('--- Histórico do Pedido ---');
        console.log(`ID do Histórico: ${this.idHistoricoPedido}`);
        console.log(`Data: ${this.data}`);
        console.log(`Status: ${this.status}`);
        console.log(`Usuário Responsável: ${this.usuarioResponsavel.nome}`);
    }
}

module.exports = HistoricoPedido;