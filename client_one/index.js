const messages = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const form = document.getElementById("form");
const communicationSelect = document.getElementById("communication-select");
let cancelLongPolling = true;
let ws;

const getCurrentTime = () => {
  const date = new Date();
  let h = date.getHours();
  let m = date.getMinutes();
  if (h < 10) h = "0" + h;
  if (m < 10) m = "0" + m;
  const hm = `${h}:${m}`;
  return hm;
};

const addSentToChatbox = () => {
  if (messageInput.value === "") return;
  const owner = document.createElement("b");
  owner.innerHTML = "You: ";
  const text = document.createElement("span");
  text.innerHTML = messageInput.value;
  const wrapper = document.createElement("div");
  wrapper.appendChild(owner);
  wrapper.appendChild(text);
  const time = document.createElement("div");
  time.className = "time";
  time.innerHTML = getCurrentTime();
  const newMessage = document.createElement("li");
  newMessage.className = "host-msg";
  newMessage.appendChild(wrapper);
  newMessage.appendChild(time);
  messages.appendChild(newMessage);
  messageInput.value = "";
};

const addRecievedToChatbox = (recievedText) => {
  const owner = document.createElement("b");
  owner.innerHTML = "Guest: ";
  const text = document.createElement("span");
  text.innerHTML = recievedText;
  const wrapper = document.createElement("div");
  wrapper.appendChild(owner);
  wrapper.appendChild(text);
  const time = document.createElement("div");
  time.className = "time";
  time.innerHTML = getCurrentTime();
  const newMessage = document.createElement("li");
  newMessage.className = "guest-msg";
  newMessage.appendChild(wrapper);
  newMessage.appendChild(time);
  messages.appendChild(newMessage);
};

const send = () => {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:8000/1");
  xhr.setRequestHeader("Content-Type", "text/plain");
  xhr.send(toSend);
  xhr.onload = function (msg) {};
  xhr.onerror = (error) => {};
};

const recievePolling = () => {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:8000/polling/1");
  xhr.send();
  xhr.onload = function () {
    console.log(`I fetch "${this.response}" via POLLING.`);
    if (this.response) addRecievedToChatbox(this.response);
  };
};

const recieveLongPolling = () => {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:8000/long-polling/1");
  xhr.onload = function () {
    console.log(`I fetch "${this.response}" via LONG POLLING.`);
    if (this.response) addRecievedToChatbox(this.response);
    if (!cancelLongPolling) recieveLongPolling();
  };
  xhr.send();
};

const onSend = (event) => {
  event.preventDefault();
  if (messageInput.value === "") return;
  else {
    toSend = messageInput.value;
    switch (communicationSelect.value) {
      case "WEB SOCKET":
        ws.send(JSON.stringify({ sender: 1, message: toSend }));
        break;
      default:
        send();
    }
    addSentToChatbox();
  }
};

var pollingInterval = setInterval(recievePolling, 500);

const communicationChange = () => {
  if (communicationSelect.value === "POLLING") {
    if (ws) ws.close();
    cancelLongPolling = true;
    pollingInterval = setInterval(recievePolling, 500);
  } else if (communicationSelect.value === "LONG POLLING") {
    cancelLongPolling = false;
    clearInterval(pollingInterval);
    if (ws) ws.close();
    recieveLongPolling();
  } else {
    clearInterval(pollingInterval);
    cancelLongPolling = true;
    ws = new WebSocket("ws://localhost:8000");
    ws.onopen = () => {
      console.log("Websocket connection opened!");
      ws.send(JSON.stringify({ openMessage: true, sender: 1, message: "Hello server!" }));
    };
    ws.onerror = (e) => {
      console.log(e);
    };
    ws.onmessage = (msg) => {
      addRecievedToChatbox(msg.data);
    };
    ws.onclose = () => {
      console.log("Websocket connection closed!");
      ws.send(JSON.stringify({ closeMessage: true, sender: 1, message: "Bye server!" }));
      ws = null;
    };
  }
};

communicationSelect.addEventListener("change", communicationChange);
form.addEventListener("submit", onSend);
