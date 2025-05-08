const Modulo = require('./Modulo'); 

class ERP {
    constructor(idERP, nome, versao) {
        this.idERP = idERP; 
        this.nome = nome; 
        this.versao = versao; 
        this.modulos = []; 
    }

    adicionarModulo(modulo) {
        if (modulo instanceof Modulo) {
            this.modulos.push(modulo);
            console.log(`Módulo "${modulo.nome}" adicionado ao ERP "${this.nome}".`);
        } else {
            console.log('Erro: O objeto fornecido não é uma instância da classe Modulo.');
        }
    }

    removerModulo(idModulo) {
        const index = this.modulos.findIndex(modulo => modulo.idModulo === idModulo);
        if (index !== -1) {
            const moduloRemovido = this.modulos.splice(index, 1)[0];
            console.log(`Módulo "${moduloRemovido.nome}" removido do ERP "${this.nome}".`);
        } else {
            console.log(`Erro: Módulo com ID ${idModulo} não encontrado.`);
        }
    }

    acessarModulo(idModulo) {
        const modulo = this.modulos.find(modulo => modulo.idModulo === idModulo);
        if (modulo) {
            console.log(`Acessando módulo "${modulo.nome}" (ID: ${modulo.idModulo}) do ERP "${this.nome}".`);
            modulo.inicializarModulo(); 
        } else {
            console.log(`Erro: Módulo com ID ${idModulo} não encontrado.`);
        }
    }
}

module.exports = ERP;