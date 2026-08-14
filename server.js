const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT =
  process.env.PORT || 3000;


// ======================================================
// CONFIGURAÇÃO MQTT
// ======================================================

const MQTT_BROKER =
  process.env.MQTT_BROKER;

const MQTT_USER =
  process.env.MQTT_USER;

const MQTT_PASS =
  process.env.MQTT_PASS;

const MQTT_TOPIC =
  process.env.MQTT_TOPIC || "fleets/gps";

let ultimaTelemetria = null;


// ======================================================
// INDEX.HTML NA RAIZ
// ======================================================

app.use(
  express.static(__dirname)
);

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});


// ======================================================
// API TELEMETRIA
// ======================================================

app.get(
  "/api/telemetria",
  (req, res) => {

    if (!ultimaTelemetria) {

      return res
        .status(404)
        .json({
          status: "aguardando",
          mensagem:
            "Nenhuma telemetria recebida."
        });
    }

    res.json(
      ultimaTelemetria
    );
  }
);


// ======================================================
// MQTT
// ======================================================

console.log(
  "Conectando ao HiveMQ Cloud..."
);

console.log(
  "Broker:",
  MQTT_BROKER
);

console.log(
  "Tópico:",
  MQTT_TOPIC
);


const mqttClient =
  mqtt.connect(
    MQTT_BROKER,
    {
      username: MQTT_USER,
      password: MQTT_PASS,

      clientId:
        "render-dashboard-" +
        Math.random()
          .toString(16)
          .substring(2, 10),

      clean: true,

      reconnectPeriod: 5000,

      connectTimeout: 30000
    }
  );


// ======================================================
// CONECTADO AO HIVEMQ
// ======================================================

mqttClient.on(
  "connect",
  () => {

    console.log();
    console.log(
      "=================================="
    );

    console.log(
      "CONECTADO AO HIVEMQ CLOUD"
    );

    console.log(
      "=================================="
    );


    mqttClient.subscribe(
      MQTT_TOPIC,
      {
        qos: 0
      },
      (erro) => {

        if (erro) {

          console.error(
            "Erro ao assinar tópico:",
            erro
          );

          return;
        }

        console.log(
          "Assinado ao tópico:",
          MQTT_TOPIC
        );
      }
    );
  }
);


// ======================================================
// RECEBE TELEMETRIA
// ======================================================

mqttClient.on(
  "message",
  (topic, message) => {

    console.log();
    console.log(
      "=================================="
    );

    console.log(
      "TELEMETRIA MQTT RECEBIDA"
    );

    console.log(
      "=================================="
    );

    console.log(
      "Tópico:",
      topic
    );


    const texto =
      message.toString();


    console.log(
      "Payload:"
    );

    console.log(
      texto
    );


    try {

      const dados =
        JSON.parse(
          texto
        );


      ultimaTelemetria =
        dados;


      console.log(
        "Veículo:",
        dados.id
      );

      console.log(
        "Latitude:",
        dados.latitude
      );

      console.log(
        "Longitude:",
        dados.longitude
      );

      console.log(
        "Velocidade:",
        dados.velocidade
      );


      // Envia para todos
      // os navegadores conectados

      io.emit(
        "telemetria",
        dados
      );

    } catch (erro) {

      console.error(
        "JSON inválido:",
        erro.message
      );
    }
  }
);


// ======================================================
// ERROS MQTT
// ======================================================

mqttClient.on(
  "error",
  (erro) => {

    console.error(
      "ERRO MQTT:",
      erro.message
    );
  }
);


mqttClient.on(
  "close",
  () => {

    console.log(
      "MQTT desconectado."
    );
  }
);


mqttClient.on(
  "reconnect",
  () => {

    console.log(
      "Reconectando ao HiveMQ..."
    );
  }
);


// ======================================================
// STATUS
// ======================================================

app.get(
  "/status",
  (req, res) => {

    res.json({

      servidor:
        "online",

      mqtt:
        mqttClient.connected
          ? "conectado"
          : "desconectado",

      topico:
        MQTT_TOPIC,

      ultimaTelemetria:
        ultimaTelemetria
    });
  }
);


// ======================================================
// SOCKET.IO
// ======================================================

io.on(
  "connection",
  (socket) => {

    console.log(
      "Navegador conectado:",
      socket.id
    );


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
          "Navegador desconectado."
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

    console.log();
    console.log(
      "=================================="
    );

    console.log(
      "SERVIDOR WEB ONLINE"
    );

    console.log(
      "Porta:",
      PORT
    );

    console.log(
      "=================================="
    );
  }
);
