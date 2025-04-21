import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import WebhookLogModel from "./model/WebhookLogModel.js";
import { fetchReplies } from "./controller/EmailController.js";
import { appRouter } from "./config/router.js";
import { createServer } from "http";
import setupSocket from "./socket.js";
import UserModel from "./model/UserModel.js";

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();
const server = createServer(app);
const io = setupSocket(server);

// Add Socket.IO middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(express.json()); // ✅ Parse JSON body
app.use(express.urlencoded({ extended: true })); // ✅ Parse URL-encoded bodies
app.use(morgan("dev")); // ✅ Logging

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Connect DB
connectDB();

// Initialize Passport
app.use(passport.initialize());

// ✅ Register Routes (Make sure middleware is initialized first)
appRouter(app);

// 📬 Gmail Webhook Listener
app.post("/gmail/webhook", async (req, res) => {
  try {
    const messageData = req.body.message?.data;
    const buffer = Buffer.from(messageData, "base64");
    const parsedData = JSON.parse(buffer.toString("utf-8"));

    const historyId = parsedData.historyId;
    const emailAddress = parsedData.emailAddress; // Gmail address that received message

    const user = await UserModel.findOne({ email: emailAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    const exists = await WebhookLogModel.findOne({ historyId });
    if (exists) return res.sendStatus(200);

    await WebhookLogModel.create({ historyId });
    await fetchReplies(user, historyId);
    // Emit event to connected clients

    io.to(`user_${user._id}`).emit("newEmail", {
      message: "New email received",
    });
    console.log("📬 Webhook received and processed successfully");
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    res.sendStatus(500);
  }
});

export default app;
