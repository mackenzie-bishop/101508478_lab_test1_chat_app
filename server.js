require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");

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
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

// Routes
app.use("/api/auth", require("./routes/auth"));

// Socket.io
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", ({ username, room }) => {
        socket.join(room);
        io.to(room).emit("message", `${username} joined ${room}`);
    });

    socket.on("chatMessage", ({ username, room, message }) => {
        io.to(room).emit("message", `${username}: ${message}`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
});