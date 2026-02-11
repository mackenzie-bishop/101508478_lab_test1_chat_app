const socket = io();

const username = localStorage.getItem("username");
const room = localStorage.getItem("room");

if (!username) window.location.href = "/view/login.html";
if (!room) window.location.href = "/view/room.html";

const roomNameEl = document.getElementById("roomName");
const userNameEl = document.getElementById("userName");
const messagesDiv = document.getElementById("messages");
const typingP = document.getElementById("typing");
const form = document.getElementById("msgForm");
const msgInput = document.getElementById("msg");
const leaveBtn = document.getElementById("leaveBtn");

// show user + room on left panel
roomNameEl.innerText = room;
userNameEl.innerText = username;

function addMessage(text) {
  const p = document.createElement("p");

  if (text.includes(" joined ") || text.includes(" left ")) {
    p.className = "system-msg";
  }

  p.innerText = text;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// join
socket.emit("joinRoom", { username, room });

// load history
socket.on("history", (history) => {
  history.forEach((m) => addMessage(`${m.from_user}: ${m.message}`));
});

// new messages
socket.on("message", (msg) => addMessage(msg));

// typing
let typingTimer;
socket.on("typing", (msg) => {
  typingP.innerText = msg;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => (typingP.innerText = ""), 1000);
});

msgInput.addEventListener("input", () => {
  socket.emit("typing", { username, room });
});

// send
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = msgInput.value.trim();
  if (!message) return;

  socket.emit("chatMessage", { username, room, message });
  msgInput.value = "";
});

// leave
leaveBtn.addEventListener("click", () => {
  socket.emit("leaveRoom", { username, room });
  localStorage.removeItem("room");
  window.location.href = "/view/room.html";
});