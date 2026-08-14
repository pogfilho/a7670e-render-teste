const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mqtt = require("mqtt");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ======================================================
// MQTT
// ======================================================

const MQTT_BROKER =
  process.env.MQTT_BROKER ||
  "mqtt://SEU_BROKER:1883";

const MQTT_USER =
  process.env.MQTT_USER || "";

const MQTT_PASS =
  process.env.MQTT_PASS || "";

const MQTT_TOPIC =
  "fleets/gps";

let ultimaTelemetria = null;


// ======================================================
// ARQUIVOS HTML
// ======================================================

app.use(
  express.static("public")
);


// ======================================================
// API DO ULTIMO DADO
// ======================================================

app.get(
  "/api/telemetria",
  (req, res) => {

    if (!ultimaTelemetria) {

      return res.status(404).json({
        erro: "Nenhuma telemetria recebida ainda"
      });
    }

    res.json(
      ultimaTelemetria
    );
  }
);


// ======================================================
// CONEXAO MQTT
// ======================================================

const mqttClient =
  mqtt.connect(
    MQTT_BROKER,
    {
      username:
        MQTT_USER || undefined,

      password:
        MQTT_PASS || undefined,

      reconnectPeriod: 5000
    }
  );


mqttClient.on(
  "connect",
  () => {

    console.log(
      "Conectado ao broker MQTT"
    );

    mqttClient.subscribe(
      MQTT_TOPIC,
      (erro) => {

        if (erro) {

          console.error(
            "Erro ao assinar tópico:",
            erro
          );

          return;
        }

        console.log(
          "Assinado:",
          MQTT_TOPIC
        );
      }
    );
  }
);


mqttClient.on(
  "message",
  (topic, message) => {

    try {

      const dados =
        JSON.parse(
          message.toString()
        );

      ultimaTelemetria =
        dados;


      console.log(
        "Telemetria recebida:"
      );

      console.log(
        dados
      );


      // envia em tempo real
      // para todos os navegadores

      io.emit(
        "telemetria",
        dados
      );

    } catch (erro) {

      console.error(
        "JSON inválido:",
        erro
      );
    }
  }
);


mqttClient.on(
  "error",
  (erro) => {

    console.error(
      "Erro MQTT:",
      erro
    );
  }
);


// ======================================================
// SOCKET.IO
// ======================================================

io.on(
  "connection",
  (socket) => {

    console.log(
      "Navegador conectado"
    );


    // envia o último dado
    // imediatamente

    if (
      ultimaTelemetria
    ) {

      socket.emit(
        "telemetria",
        ultimaTelemetria
      );
    }


    socket.on(
      "disconnect",
      () => {

        console.log(
          "Navegador desconectado"
        );
      }
    );
  }
);


// ======================================================
// SERVIDOR
// ======================================================

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Servidor iniciado na porta ${PORT}`
    );
  }
);
