const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    mensagem: "API A7670E ativa"
  });
});

app.post("/api/localizacao", (req, res) => {
  console.log("===================================");
  console.log("TELEMETRIA RECEBIDA");
  console.log(req.body);
  console.log("===================================");

  res.status(200).json({
    sucesso: true,
    mensagem: "Telemetria recebida com sucesso",
    dados: req.body
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
