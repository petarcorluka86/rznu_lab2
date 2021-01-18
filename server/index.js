const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const bodyParser = require("body-parser");
app.use(bodyParser.text({ type: "text/plain" }));
const port = 8000;

let last_client_one_msg = null;
let last_client_two_msg = null;
let new_message_from_client_one = false;
let new_message_from_client_two = false;

let connections = { one: false, two: false };

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
      if (connections.two) {
        const response = connections.two;
        connections.two = false;
        response.send(msg);
      } else {
        new_message_from_client_one = true;
        last_client_one_msg = msg;
        res.send();
      }
    } else if (id === "2") {
      if (connections.one) {
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}!`);
});
