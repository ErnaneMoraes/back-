const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('./database'); // Supondo que o servidor esteja nesse arquivo
const { expect } = chai;

chai.use(chaiHttp);

describe('Testes da Tela de Login', () => {
    it('Deve fazer login com credenciais corretas', (done) => {
        chai.request(server)
            .post('/login')
            .send({ username: 'usuarioTeste', password: 'senha123' })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('token');
                done();
            });
    });