require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");

const GroupMessage = require("./models/GroupMessage");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/view", express.static(path.join(__dirname, "view")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// Routes
app.use("/api/auth", require("./routes/auth"));

// Socket.io
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join room and load history
  socket.on("joinRoom", async ({ username, room }) => {
    socket.join(room);

    // broadcast join message
    io.to(room).emit("message", `${username} joined ${room}`);

    // send last 20 messages to THIS user only
    try {
      const history = await GroupMessage.find({ room })
        .sort({ date_sent: -1 })
        .limit(20);

      // send in correct order oldest -> newest
      socket.emit("history", history.reverse());
    } catch (err) {
      console.log("History load error:", err.message);
    }
  });

  // Leave room
  socket.on("leaveRoom", ({ username, room }) => {
    socket.leave(room);
    io.to(room).emit("message", `${username} left ${room}`);
  });

  // Typing indicator
  socket.on("typing", ({ username, room }) => {
    socket.to(room).emit("typing", `${username} is typing...`);
  });

  // Chat message (save to DB + broadcast)
  socket.on("chatMessage", async ({ username, room, message }) => {
    try {
      // save to MongoDB
      await GroupMessage.create({
        from_user: username,
        room,
        message
      });

      // broadcast to room
      io.to(room).emit("message", `${username}: ${message}`);
    } catch (err) {
      console.log("Save message error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});