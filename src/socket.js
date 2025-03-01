import { Server } from "socket.io";

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins (update for security in production)
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔥 New client connected: ${socket.id}`);

    socket.on("message", (data) => {
      console.log(`📩 Message received:`, data);
      io.emit("message", data); // Broadcast message to all clients
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export default setupSocket;
