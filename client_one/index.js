const messages = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const form = document.getElementById("form");
const communicationSelect = document.getElementById("communication-select");

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
  xhr.onload = function () {};
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
    recieveLongPolling();
  };
  xhr.send();
};

const sendWebSocket = () => {};

const onSend = (event) => {
  event.preventDefault();
  if (messageInput.value === "") return;
  else {
    toSend = messageInput.value;
    switch (communicationSelect.value) {
      case "WEB SOCKET":
        sendWebSocket();
        break;
      default:
        send();
    }
    addSentToChatbox();
  }
};

const pollingInterval = setInterval(recievePolling, 500);

const communicationChange = () => {
  if (communicationSelect.value === "POLLING") {
    clearInterval(pollingInterval);
    setInterval(recievePolling, 500);
  } else if (communicationSelect.value === "LONG POLLING") {
    clearInterval(pollingInterval);
    recieveLongPolling();
  } else {
    clearInterval(pollingInterval);
  }
};

communicationSelect.addEventListener("change", communicationChange);
form.addEventListener("submit", onSend);
