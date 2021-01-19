const express = require("express");
const cors = require("cors");
const http = require("http");
const bodyParser = require("body-parser");
const app = express();
app.use(cors());
app.use(bodyParser.text({ type: "text/plain" }));
const server = http.createServer(app);
const port = 8000;
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
let last_client_one_msg = null;
let last_client_two_msg = null;
let new_message_from_client_one = false;
let new_message_from_client_two = false;
let connections = { one: false, two: false };
let websocket = { 1: null, 2: null };

app.get("/polling/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id === "1" && new_message_from_client_two) {
      new_message_from_client_two = false;
      res.send(last_client_two_msg);
    } else if (id === "2" && new_message_from_client_one) {
      new_message_from_client_one = false;
      res.send(last_client_one_msg);
    } else {
      res.send();
    }
  } catch (error) {
    res.send("Error in get method.");
  }
});

app.get("/long-polling/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id === "1") {
      if (!new_message_from_client_two) {
        connections.one = res;
      } else {
        new_message_from_client_two = false;
        res.send(last_client_two_msg);
      }
    } else if (id === "2") {
      if (!new_message_from_client_one) {
        connections.two = res;
      } else {
        new_message_from_client_one = false;
        res.send(last_client_one_msg);
      }
    } else {
      res.send();
    }
  } catch (error) {
    res.send("Error in get method.");
  }
});

app.post("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const msg = req.body;
    if (id === "1") {
      if (websocket[2]) {
        websocket[2].send(msg);
      } else if (connections.two) {
        const response = connections.two;
        connections.two = false;
        response.send(msg);
      } else {
        new_message_from_client_one = true;
        last_client_one_msg = msg;
        res.send();
      }
    } else if (id === "2") {
      if (websocket[1]) {
        websocket[1].send(msg);
      } else if (connections.one) {
        const response = connections.one;
        connections.one = false;
        response.send(msg);
      } else {
        new_message_from_client_two = true;
        last_client_two_msg = msg;
        res.send();
      }
    }
  } catch (error) {
    res.send("Error in post method.");
  }
});

wss.on("connection", (ws) => {
  wss.clients.forEach((client) => {
    client.on("message", async (data) => {
      const data_json = JSON.parse(data);
      if (data_json.openMessage) {
        client.id = data_json.sender;
        websocket[data_json.sender] = client;
      } else if (data_json.closeMessage) {
        websocket[data_json.sender] = null;
      } else if (data_json.sender === 1) {
        if (connections.two) {
          const response = connections.two;
          connections.two = false;
          response.send(data_json.message);
        } else {
          last_client_one_msg = data_json.message;
          new_message_from_client_one = true;
        }
      } else if (data_json.sender === 2) {
        if (connections.one) {
          const response = connections.one;
          connections.one = false;
          response.send(data_json.message);
        } else {
          last_client_two_msg = data_json.message;
          new_message_from_client_two = true;
        }
      }
    });
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});
