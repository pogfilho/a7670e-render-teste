const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const path = require("path");
const { Server } = require("socket.io");

// ======================================================
// EXPRESS + HTTP + SOCKET.IO
// ======================================================

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;


// ======================================================
// CONFIGURACAO HIVEMQ CLOUD
// ======================================================

const MQTT_BROKER =
  "mqtts://5ec53482f3d345e0a10b9002d085a379.s1.eu.hivemq.cloud";

const MQTT_USER =
  "paulo";

const MQTT_PASS =
  "07l20392";

const MQTT_TOPIC =
  "fleets/gps";


// ======================================================
// ESTADO DO SERVIDOR
// ======================================================

let ultimaTelemetria = null;

let ultimaMensagemRecebida = null;

let ultimoErroMQTT = null;


// ======================================================
// LOG INICIAL
// ======================================================

console.log();
console.log("==========================================");
console.log(" SYSLAE FLEET");
console.log(" SERVIDOR MQTT + HIVEMQ CLOUD");
console.log("==========================================");

console.log("Broker:", MQTT_BROKER);
console.log("Usuario:", MQTT_USER);
console.log("Topico:", MQTT_TOPIC);
console.log("Porta MQTT: 8883");
console.log("TLS: habilitado");


// ======================================================
// INDEX.HTML NA PASTA RAIZ
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
// API - ULTIMA TELEMETRIA
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
            "Nenhuma telemetria recebida ainda."

        });

    }

    res.json(
      ultimaTelemetria
    );

  }
);


// ======================================================
// STATUS DO SERVIDOR
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

      broker:
        MQTT_BROKER,

      usuario:
        MQTT_USER,

      topico:
        MQTT_TOPIC,

      ultimaMensagemRecebida:
        ultimaMensagemRecebida,

      ultimaTelemetria:
        ultimaTelemetria,

      ultimoErroMQTT:
        ultimoErroMQTT

    });

  }
);


// ======================================================
// CONECTANDO AO HIVEMQ
// ======================================================

console.log();
console.log("==========================================");
console.log(" CONECTANDO AO HIVEMQ CLOUD");
console.log("==========================================");


const mqttClient = mqtt.connect(

  MQTT_BROKER,

  {

    username:
      MQTT_USER,

    password:
      MQTT_PASS,

    clientId:
      "render-dashboard-" +
      Math.random()
        .toString(16)
        .substring(2, 10),

    clean:
      true,

    reconnectPeriod:
      5000,

    connectTimeout:
      30000,

    // MQTT 3.1.1
    protocolVersion:
      4,

    // Valida certificado TLS
    rejectUnauthorized:
      true

  }

);


// ======================================================
// MQTT CONECTADO
// ======================================================

mqttClient.on(
  "connect",
  (connack) => {

    ultimoErroMQTT = null;


    console.log();
    console.log("##########################################");
    console.log(" HIVEMQ CLOUD CONECTADO");
    console.log(" MQTT + TLS: OK");
    console.log("##########################################");


    console.log(
      "Session Present:",
      connack.sessionPresent
    );


    // ==================================================
    // ASSINA TOPICO
    // ==================================================

    console.log();
    console.log(
      "Assinando topico:",
      MQTT_TOPIC
    );


    mqttClient.subscribe(

      MQTT_TOPIC,

      {
        qos: 0
      },

      (
        erro,
        granted
      ) => {

        if (erro) {

          console.error();
          console.error(
            "ERRO AO ASSINAR TOPICO:"
          );

          console.error(
            erro.message
          );

          return;

        }


        console.log();
        console.log("##########################################");
        console.log(" TOPICO ASSINADO COM SUCESSO");
        console.log("##########################################");

        console.log(
          "Topico:",
          MQTT_TOPIC
        );

        console.log(
          "QoS:",
          granted
        );

      }

    );

  }
);


// ======================================================
// RECEBE MENSAGEM MQTT
// ======================================================

mqttClient.on(
  "message",
  (
    topic,
    message
  ) => {

    const texto =
      message.toString();


    ultimaMensagemRecebida =
      new Date().toISOString();


    console.log();
    console.log("==========================================");
    console.log(" TELEMETRIA MQTT RECEBIDA");
    console.log("==========================================");

    console.log(
      "Topico:",
      topic
    );

    console.log(
      "Payload:"
    );

    console.log(
      texto
    );


    // ==================================================
    // CONVERTE JSON
    // ==================================================

    try {

      const dados =
        JSON.parse(
          texto
        );


      ultimaTelemetria =
        dados;


      console.log();
      console.log(
        "JSON VALIDO"
      );


      console.log(
        "ID:",
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


      console.log(
        "Satelites:",
        dados.satelites
      );


      console.log(
        "HDOP:",
        dados.hdop
      );


      console.log(
        "Data/Hora:",
        dados.dataHora
      );


      // ==================================================
      // ENVIA TELEMETRIA PARA O HTML
      // ==================================================

      io.emit(
        "telemetria",
        dados
      );


      console.log();
      console.log(
        "Telemetria enviada para o dashboard."
      );

    }

    catch (erro) {

      console.error();
      console.error(
        "ERRO: JSON INVALIDO"
      );

      console.error(
        erro.message
      );

    }

  }
);


// ======================================================
// ERRO MQTT
// ======================================================

mqttClient.on(
  "error",
  (erro) => {

    ultimoErroMQTT = {

      mensagem:
        erro.message || null,

      codigo:
        erro.code || null,

      dataHora:
        new Date().toISOString()

    };


    console.error();
    console.error("##########################################");
    console.error(" ERRO MQTT");
    console.error("##########################################");


    console.error(
      "Mensagem:",
      erro.message
    );


    console.error(
      "Codigo:",
      erro.code
    );


    if (erro.stack) {

      console.error();
      console.error(
        "Stack:"
      );

      console.error(
        erro.stack
      );

    }

  }
);


// ======================================================
// MQTT OFFLINE
// ======================================================

mqttClient.on(
  "offline",
  () => {

    console.log();
    console.log(
      "MQTT: CLIENTE OFFLINE"
    );

  }
);


// ======================================================
// CONEXAO MQTT FECHADA
// ======================================================

mqttClient.on(
  "close",
  () => {

    console.log();
    console.log(
      "MQTT: CONEXAO FECHADA"
    );

  }
);


// ======================================================
// RECONECTANDO
// ======================================================

mqttClient.on(
  "reconnect",
  () => {

    console.log();
    console.log(
      "MQTT: TENTANDO RECONECTAR AO HIVEMQ..."
    );

  }
);


// ======================================================
// EVENTOS MQTT PARA DIAGNOSTICO
// ======================================================

mqttClient.on(
  "packetsend",
  (packet) => {

    if (
      packet.cmd === "connect" ||
      packet.cmd === "subscribe"
    ) {

      console.log(
        "MQTT pacote enviado:",
        packet.cmd
      );

    }

  }
);


mqttClient.on(
  "packetreceive",
  (packet) => {

    if (
      packet.cmd === "connack" ||
      packet.cmd === "suback"
    ) {

      console.log(
        "MQTT pacote recebido:",
        packet.cmd
      );

    }

  }
);


// ======================================================
// SOCKET.IO
// ======================================================

io.on(
  "connection",
  (socket) => {

    console.log();
    console.log(
      "Navegador conectado:"
    );

    console.log(
      socket.id
    );


    // ==================================================
    // SE JA EXISTIR TELEMETRIA
    // ENVIA PARA O NAVEGADOR
    // ==================================================

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

        console.log();
        console.log(
          "Navegador desconectado:"
        );

        console.log(
          socket.id
        );

      }
    );

  }
);


// ======================================================
// INICIA SERVIDOR WEB
// ======================================================

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log();
    console.log("##########################################");
    console.log(" SERVIDOR WEB ONLINE");
    console.log("##########################################");

    console.log(
      "Porta:",
      PORT
    );

    console.log();
    console.log(
      "Aguardando conexao MQTT..."
    );

  }
);
