import { Server } from "socket.io";

let io;

const setupSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔥 New client connected: ${socket.id}`);

    // Join user-specific room for notifications
    socket.on("join", (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their notification room`);
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
