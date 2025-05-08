class Endereco {
    constructor(CEP, rua, numero, bairro, cidade, uf, complemento) {
        this.CEP = CEP;
        this.rua = rua;
        this.numero = numero;
        this.bairro = bairro;
        this.cidade = cidade;
        this.uf = uf;
        this.complemento = complemento;
    }

    exibirEndereco() {
        console.log('--- Endereço ---');
        console.log(`CEP: ${this.CEP}`);
        console.log(`Rua: ${this.rua}`);
        console.log(`Número: ${this.numero}`);
        console.log(`Bairro: ${this.bairro}`);
        console.log(`Cidade: ${this.cidade}`);
        console.log(`UF: ${this.uf}`);
        console.log(`Complemento: ${this.complemento}`);
    }

    static cadastrarEndereco(listaEnderecos, endereco) {
        listaEnderecos.push(endereco);
        console.log('Endereço cadastrado com sucesso!');
    }

    static atualizarEndereco(listaEnderecos, CEP, novosDados) {
        const endereco = listaEnderecos.find(end => end.CEP === CEP);
        if (endereco) {
            Object.assign(endereco, novosDados);
            console.log('Endereço atualizado com sucesso!');
        } else {
            console.log('Endereço não encontrado.');
        }
    }

    static excluirEndereco(listaEnderecos, CEP) {
        const index = listaEnderecos.findIndex(end => end.CEP === CEP);
        if (index !== -1) {
            listaEnderecos.splice(index, 1);
            console.log('Endereço excluído com sucesso!');
        } else {
            console.log('Endereço não encontrado.');
        }
    }
}

module.exports = Endereco;