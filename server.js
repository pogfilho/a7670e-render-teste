const express = require("express");

const app = express();

app.use(express.json());

// Guarda a última telemetria recebida
let ultimaTelemetria = null;


// ============================================================
// PAGINA HTML
// ============================================================

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Telemetria A7670E</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f6f8;
      margin: 0;
      padding: 0;
    }

    header {
      background: #1f2937;
      color: white;
      padding: 20px;
      text-align: center;
    }

    .container {
      max-width: 900px;
      margin: 30px auto;
      padding: 20px;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }

    .status {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .online {
      color: green;
    }

    .offline {
      color: red;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 15px;
    }

    .item {
      background: #f9fafb;
      border-radius: 8px;
      padding: 15px;
    }

    .label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 5px;
    }

    .value {
      font-size: 22px;
      font-weight: bold;
      color: #111827;
    }

    pre {
      background: #111827;
      color: #e5e7eb;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
    }

    .erro {
      color: #b91c1c;
    }
  </style>
</head>

<body>

<header>
  <h1>ESP32 + A7670E</h1>
  <p>Monitor de Telemetria</p>
</header>

<div class="container">

  <div class="card">

    <div id="status" class="status">
      Carregando...
    </div>

    <div class="grid">

      <div class="item">
        <div class="label">Veículo</div>
        <div id="id" class="value">-</div>
      </div>

      <div class="item">
        <div class="label">Latitude</div>
        <div id="latitude" class="value">-</div>
      </div>

      <div class="item">
        <div class="label">Longitude</div>
        <div id="longitude" class="value">-</div>
      </div>

      <div class="item">
        <div class="label">Velocidade</div>
        <div id="velocidade" class="value">-</div>
      </div>

      <div class="item">
        <div class="label">Satélites</div>
        <div id="satelites" class="value">-</div>
      </div>

      <div class="item">
        <div class="label">HDOP</div>
        <div id="hdop" class="value">-</div>
      </div>

      <div class="item">
        <div class="label">Data/Hora</div>
        <div id="dataHora" class="value">-</div>
      </div>

    </div>

  </div>


  <div class="card">

    <h2>JSON recebido</h2>

    <pre id="json">
Nenhuma telemetria recebida.
    </pre>

  </div>

</div>


<script>

async function carregarTelemetria() {

  try {

    const resposta =
      await fetch("/api/ultima-localizacao");

    const dados =
      await resposta.json();


    if (!dados.disponivel) {

      document.getElementById("status").innerHTML =
        "<span class='offline'>Nenhuma telemetria recebida</span>";

      return;
    }


    const t = dados.telemetria;


    document.getElementById("status").innerHTML =
      "<span class='online'>Telemetria recebida</span>";


    document.getElementById("id").textContent =
      t.id ?? "-";


    document.getElementById("latitude").textContent =
      t.latitude ?? "-";


    document.getElementById("longitude").textContent =
      t.longitude ?? "-";


    document.getElementById("velocidade").textContent =
      t.velocidade !== undefined
      ? t.velocidade + " km/h"
      : "-";


    document.getElementById("satelites").textContent =
      t.satelites ?? "-";


    document.getElementById("hdop").textContent =
      t.hdop ?? "-";


    document.getElementById("dataHora").textContent =
      t.dataHora ?? "-";


    document.getElementById("json").textContent =
      JSON.stringify(
        t,
        null,
        2
      );

  }

  catch (erro) {

    document.getElementById("status").innerHTML =
      "<span class='erro'>Erro ao acessar o servidor</span>";

    console.error(erro);
  }
}


// Atualiza a cada 3 segundos
setInterval(
  carregarTelemetria,
  3000
);


// Primeira leitura
carregarTelemetria();

</script>

</body>
</html>
  `);
});


// ============================================================
// RECEBE TELEMETRIA
// ============================================================

app.post("/api/localizacao", (req, res) => {

  console.log(
    "==================================="
  );

  console.log(
    "TELEMETRIA RECEBIDA"
  );

  console.log(
    req.body
  );

  console.log(
    "==================================="
  );


  ultimaTelemetria =
    req.body;


  res.status(200).json({

    sucesso: true,

    mensagem:
      "Telemetria recebida com sucesso",

    dados:
      req.body
  });
});


// ============================================================
// RETORNA ULTIMA TELEMETRIA
// ============================================================

app.get(
  "/api/ultima-localizacao",
  (req, res) => {

    if (!ultimaTelemetria) {

      return res.json({

        disponivel: false,

        telemetria: null
      });
    }


    res.json({

      disponivel: true,

      telemetria:
        ultimaTelemetria
    });
  }
);


// ============================================================
// SERVIDOR
// ============================================================

const PORT =
  process.env.PORT || 3000;


app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "Servidor iniciado na porta " + PORT
    );
  }
);
