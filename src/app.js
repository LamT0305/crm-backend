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
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Connect DB
connectDB();

// Initialize Passport
app.use(passport.initialize());

// ✅ Register Routes (Make sure middleware is initialized first)
appRouter(app);

// 🔔 Gmail Webhook Listener
app.post("/gmail/webhook", async (req, res) => {
  console.log("📩 New Gmail notification received!", req.body);

  const messageData = req.body.message?.data;
  let parsedData;
  if (messageData) {
    try {
      const buffer = Buffer.from(messageData, "base64");
      parsedData = JSON.parse(buffer.toString("utf-8"));
    } catch (error) {
      console.error("❌ Failed to parse message data:", error);
      return res.status(400).json({ error: "Invalid message data" });
    }
  }

  const historyId = parsedData?.historyId;
  if (!historyId) {
    console.error("❌ Missing historyId in webhook payload", req.body);
    return res.status(400).json({ error: "Missing historyId" });
  }

  try {
    // ✅ Check for duplicate webhook
    const isDuplicate = await WebhookLogModel.exists({ historyId });
    if (isDuplicate) {
      console.log(`⚠️ Duplicate webhook detected, ignoring: ${historyId}`);
      return res.sendStatus(200);
    }

    // ✅ Store webhook log before processing
    await WebhookLogModel.create({ historyId });

    // ✅ Process Gmail replies asynchronously
    fetchReplies()
      .then(() =>
        console.log(`📨 Processed emails for historyId: ${historyId}`)
      )
      .catch((error) => console.error("❌ Error fetching replies:", error));

    io.emit("newEmail", { message: "New email received" });
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error processing Gmail webhook:", error);
    res.sendStatus(500);
  }
});

export default app;
