const messages = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const form = document.getElementById("form");
const communicationSelect = document.getElementById("communication-select");
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
  xhr.open("POST", "http://localhost:8000/2");
  xhr.setRequestHeader("Content-Type", "text/plain");
  xhr.send(toSend);
  xhr.onload = function () {};
};

const recievePolling = () => {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:8000/polling/2");
  xhr.send();
  xhr.onload = function () {
    console.log(`I fetch "${this.response}" via POLLING.`);
    if (this.response) addRecievedToChatbox(this.response);
  };
};

const recieveLongPolling = () => {
  let xhr = new XMLHttpRequest();
  xhr.open("GET", "http://localhost:8000/long-polling/2");
  xhr.onload = function () {
    console.log(`I fetch "${this.response}" via LONG POLLING.`);
    if (this.response) addRecievedToChatbox(this.response);
    recieveLongPolling();
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
        ws.send(JSON.stringify({ sender: 2, message: toSend }));
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
    pollingInterval = setInterval(recievePolling, 500);
  } else if (communicationSelect.value === "LONG POLLING") {
    clearInterval(pollingInterval);
    if (ws) ws.close();
    recieveLongPolling();
  } else {
    clearInterval(pollingInterval);
    ws = new WebSocket("ws://localhost:8000");
    ws.onopen = () => {
      console.log("Websocket connection opened!");
    };
    ws.onerror = (e) => {
      console.log(e);
    };
    ws.onmessage = (msg) => {
      console.log(msg.data);
    };
    ws.onclose = () => {
      console.log("Websocket connection closed!");
      ws = null;
    };
  }
};

communicationSelect.addEventListener("change", communicationChange);
form.addEventListener("submit", onSend);
