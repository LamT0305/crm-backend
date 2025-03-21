import http from "http";
import setupSocket from "./socket.js"; // Import WebSocket setup
import app from "./app.js"; // Import Express app


const server = http.createServer(app); // Create HTTP server

// Setup WebSocket (Socket.IO)
setupSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


