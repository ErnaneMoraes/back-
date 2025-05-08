class Modulo {
    constructor(idModulo, nome, descricao) {
        this.idModulo = idModulo; 
        this.nome = nome; 
        this.descricao = descricao; 
    }

    inicializarModulo() {
        console.log(`Módulo "${this.nome}" (ID: ${this.idModulo}) inicializado.`);
        console.log(`Descrição: ${this.descricao}`);
    }
    
    encerrarModulo() {
        console.log(`Módulo "${this.nome}" (ID: ${this.idModulo}) encerrado.`);
    }
}

module.exports = Modulo;