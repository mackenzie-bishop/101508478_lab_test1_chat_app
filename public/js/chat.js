const socket = io();

const username = localStorage.getItem("username");
const room = localStorage.getItem("room");

if (!username) window.location.href = "/view/login.html";
if (!room) window.location.href = "/view/room.html";

document.getElementById("info").innerText = `User: ${username} | Room: ${room}`;

const messagesDiv = document.getElementById("messages");
const typingP = document.getElementById("typing");
const form = document.getElementById("msgForm");
const msgInput = document.getElementById("msg");
const leaveBtn = document.getElementById("leaveBtn");

function addMessage(text) {
  const p = document.createElement("p");
  p.innerText = text;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Join room
socket.emit("joinRoom", { username, room });

// Receive history from server (last 20)
socket.on("history", (history) => {
  // history items look like: {from_user, room, message, date_sent}
  history.forEach((m) => {
    addMessage(`${m.from_user}: ${m.message}`);
  });
});

// Receive messages
socket.on("message", (msg) => {
  addMessage(msg);
});

// Typing indicator
let typingTimer;
socket.on("typing", (msg) => {
  typingP.innerText = msg;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    typingP.innerText = "";
  }, 1000);
});

msgInput.addEventListener("input", () => {
  socket.emit("typing", { username, room });
});

// Send message
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = msgInput.value.trim();
  if (!message) return;

  socket.emit("chatMessage", { username, room, message });
  msgInput.value = "";
});

// Leave room
leaveBtn.addEventListener("click", () => {
  socket.emit("leaveRoom", { username, room });
  localStorage.removeItem("room");
  window.location.href = "/view/room.html";
});
