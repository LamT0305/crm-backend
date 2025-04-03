import { Server } from "socket.io";

let io;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔥 New client connected: ${socket.id}`);

    socket.on("join", (userId) => {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(`👤 User ${userId} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export default setupSocket;
