const express = require("express");
const http = require("http");
const mqtt = require("mqtt");
const path = require("path");
const { Server } = require("socket.io");

// ======================================================
// EXPRESS + HTTP + SOCKET.IO
// ======================================================

const app = express();

const server =
  http.createServer(app);

const io =
  new Server(server);

const PORT =
  process.env.PORT || 3000;


// ======================================================
// VARIAVEIS MQTT
// ======================================================

const MQTT_BROKER =
  process.env.MQTT_BROKER;

const MQTT_USER =
  process.env.MQTT_USER;

const MQTT_PASS =
  process.env.MQTT_PASS;

const MQTT_TOPIC =
  process.env.MQTT_TOPIC ||
  "fleets/gps";


// ======================================================
// ESTADO
// ======================================================

let ultimaTelemetria =
  null;

let ultimoErroMQTT =
  null;


// ======================================================
// MOSTRA CONFIGURACAO SEM EXPOR SENHA
// ======================================================

console.log();
console.log("==================================");
console.log(" CONFIGURACAO DO SERVIDOR");
console.log("==================================");

console.log(
  "Broker:",
  MQTT_BROKER || "NAO DEFINIDO"
);

console.log(
  "Usuario:",
  MQTT_USER || "NAO DEFINIDO"
);

console.log(
  "Topico:",
  MQTT_TOPIC
);

console.log(
  "Senha configurada:",
  MQTT_PASS ? "SIM" : "NAO"
);


// ======================================================
// INDEX.HTML NA RAIZ
// ======================================================

app.use(
  express.static(__dirname)
);

app.get(
  "/",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "index.html"
      )
    );
  }
);


// ======================================================
// API - ULTIMA TELEMETRIA
// ======================================================

app.get(
  "/api/telemetria",
  (req, res) => {

    if (
      !ultimaTelemetria
    ) {

      return res
        .status(404)
        .json({
          status:
            "aguardando",

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

      broker:
        MQTT_BROKER || null,

      usuario:
        MQTT_USER || null,

      topico:
        MQTT_TOPIC,

      ultimaTelemetria:
        ultimaTelemetria,

      ultimoErroMQTT:
        ultimoErroMQTT
    });
  }
);


// ======================================================
// VALIDA CONFIGURACAO
// ======================================================

if (
  !MQTT_BROKER
) {

  console.error(
    "ERRO: MQTT_BROKER nao configurado."
  );
}


if (
  !MQTT_USER
) {

  console.error(
    "ERRO: MQTT_USER nao configurado."
  );
}


if (
  !MQTT_PASS
) {

  console.error(
    "ERRO: MQTT_PASS nao configurado."
  );
}


// ======================================================
// CONEXAO MQTT
// ======================================================

console.log();
console.log("==================================");
console.log(" CONECTANDO AO HIVEMQ CLOUD");
console.log("==================================");


const mqttClient =
  mqtt.connect(
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

      protocolVersion:
        4

    }
  );


// ======================================================
// CONECTADO
// ======================================================

mqttClient.on(
  "connect",
  (connack) => {

    ultimoErroMQTT =
      null;


    console.log();
    console.log(
      "=================================="
    );

    console.log(
      " CONECTADO AO HIVEMQ CLOUD"
    );

    console.log(
      "=================================="
    );


    console.log(
      "CONNACK:",
      connack
    );


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

        if (
          erro
        ) {

          console.error();
          console.error(
            "ERRO AO ASSINAR TOPICO:"
          );

          console.error(
            erro
          );

          return;
        }


        console.log();
        console.log(
          "TOPICO ASSINADO COM SUCESSO"
        );

        console.log(
          granted
        );
      }
    );
  }
);


// ======================================================
// TELEMETRIA RECEBIDA
// ======================================================

mqttClient.on(
  "message",
  (
    topic,
    message
  ) => {

    console.log();
    console.log(
      "=================================="
    );

    console.log(
      " TELEMETRIA MQTT RECEBIDA"
    );

    console.log(
      "=================================="
    );


    console.log(
      "Topico:",
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
      // ENVIA PARA O HTML
      // ==================================================

      io.emit(
        "telemetria",
        dados
      );


    } catch (
      erro
    ) {

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

    ultimoErroMQTT =
      {
        mensagem:
          erro.message || null,

        codigo:
          erro.code || null,

        dataHora:
          new Date().toISOString()
      };


    console.error();
    console.error(
      "=================================="
    );

    console.error(
      " ERRO MQTT"
    );

    console.error(
      "=================================="
    );


    console.error(
      "Mensagem:",
      erro.message
    );


    console.error(
      "Codigo:",
      erro.code
    );


    if (
      erro.stack
    ) {

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
// CONEXAO FECHADA
// ======================================================

mqttClient.on(
  "close",
  () => {

    console.log();
    console.log(
      "MQTT: conexao fechada."
    );
  }
);


// ======================================================
// CLIENTE OFFLINE
// ======================================================

mqttClient.on(
  "offline",
  () => {

    console.log(
      "MQTT: cliente offline."
    );
  }
);


// ======================================================
// RECONECTANDO
// ======================================================

mqttClient.on(
  "reconnect",
  () => {

    console.log(
      "MQTT: tentando reconectar ao HiveMQ..."
    );
  }
);


// ======================================================
// EVENTOS DE PACOTES MQTT
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


    // Se já existir telemetria,
    // envia imediatamente

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
          "Navegador desconectado:",
          socket.id
        );
      }
    );
  }
);


// ======================================================
// INICIA SERVIDOR
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
      " SERVIDOR WEB ONLINE"
    );

    console.log(
      "=================================="
    );


    console.log(
      "Porta:",
      PORT
    );


    console.log(
      "Aguardando conexao MQTT..."
    );
  }
);
