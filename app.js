const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { connectDB, pool } = require('./database');
const {
  router: loginRouter,
  verifyJWT: originalVerifyJWT,
  router: verifyTokenRouter
} = require('./src/models/login');
const statusRouter = require('./src/models/status');
const usuarioRoutes = require('./usuarioRoutes');
const pedidoRoutes = require('./pedidoRoutes');
const estoqueRoutes = require('./estoqueRoutes');
const itemRoutes = require('./itemRoutes');
const pessoaRoutes = require('./pessoaRoutes');


const app = express();
const PORT = process.env.PORT || 8080;

// Conexão com o banco de dados
connectDB();

// CORS manual para garantir funcionamento no Cloud Run
const corsOptions = {
  origin: '*', // Ou especifique: ['https://sistemaaraleve.shop']
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
  credentials: true,
};

app.use(cors(corsOptions));

app.options('/usuarios/:id', cors(corsOptions)); 
app.options('*', cors(corsOptions));


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-access-token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware JWT com exceção para OPTIONS
function verifyJWT(req, res, next) {
  if (req.method === "OPTIONS") return next();
  return originalVerifyJWT(req, res, next);
}

// Rotas principais
app.use('/api', usuarioRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/itens', itemRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/pessoas', pessoaRoutes);

// Acesso ao sistema (estático) protegido por JWT
app.use('/sistema', verifyJWT, express.static(path.join(__dirname, 'sistema_aralev-master')));

// Rota OPTIONS explícita para evitar bloqueios
app.options('/usuarios/:id', cors(corsOptions));

// GET usuários
app.get("/usuarios", verifyJWT, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM tb_usuario");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).send("Erro ao buscar usuários");
  }
});

// POST usuário
app.post("/usuarios", verifyJWT, async (req, res) => {
  try {
    const { nome, login, senha, nivelAcesso } = req.body;
    const Usuario = require('./src/models/Usuario');
    const user = new Usuario();
    const resultado = await user.criarUsuario(nome, login, senha, nivelAcesso);

    if (!resultado) {
      return res.status(500).json({ mensagem: "Erro ao criar usuário", detalhe: "Resultado indefinido" });
    }

    if (resultado.erro) {
      if (resultado.erro === "Login já está em uso") {
        return res.status(409).json({ mensagem: resultado.erro });
      }
      return res.status(500).json({ mensagem: resultado.erro, detalhe: resultado.detalhe });
    }

    res.status(201).json({ sucesso: true, id: resultado.id });

  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({ mensagem: "Erro ao criar usuário", detalhe: err.message });
  }
});

// PUT usuário
//app.put("/usuarios/:id", cors(corsOptions), verifyJWT, async (req, res) => {
  app.put("/usuarios/:id", cors(corsOptions), async (req, res) => {
  const id = req.params.id;
  const { nome, login, senha, nivelAcesso } = req.body;

  if (!nome || !login) {
    return res.status(400).json({ sucesso: false, mensagem: "Preencha todos os campos corretamente." });
  }

  const Usuario = require('./src/models/Usuario');
  const user = new Usuario();

  try {
    const resultado = await user.atualizarUsuario(id, { nome, login, senha, nivelAcesso });

    if (resultado.sucesso) {
      return res.status(200).json({ sucesso: true, mensagem: "Usuário atualizado com sucesso." });
    } else {
      return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
    }
  } catch (erro) {
    console.error("Erro ao atualizar usuário:", erro);
    return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao atualizar o usuário." });
  }
});

// DELETE usuário
app.delete("/usuarios/:id", verifyJWT, async (req, res) => {
  const id = req.params.id;
  const Usuario = require('./src/models/Usuario');
  const user = new Usuario();

  try {
    const resultado = await user.excluirUsuario(id);

    if (resultado.sucesso) {
      return res.status(200).json({ sucesso: true, mensagem: "Usuário excluído com sucesso." });
    } else {
      return res.status(404).json({ sucesso: false, mensagem: "Usuário não encontrado." });
    }
  } catch (erro) {
    console.error("Erro ao excluir usuário:", erro);
    return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao excluir o usuário." });
  }
});

// DESCRIBE tabela
app.get("/desc", async (req, res) => {
  try {
    const [rows] = await pool.query("DESCRIBE tb_usuario;");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar descrição da tabela:", err);
    res.status(500).send("Erro ao buscar descrição da tabela");
  }
});

// Redirecionamento local para testes
app.get("/inicio", verifyJWT, (req, res) => {
  res.redirect("http://127.0.0.1:5500/sistema_aralev-master/inicio.html");
});

// Login/Logout
app.use('/login', loginRouter);
app.use('/logout', loginRouter);
app.use(verifyTokenRouter);

// Status API
app.use(statusRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} http://localhost:${PORT}/`);
});

// Rota de teste
app.get('/', (req, res) => {
    res.send('API de Pessoas está funcionando!');
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ erro: 'Erro interno no servidor' });
});
