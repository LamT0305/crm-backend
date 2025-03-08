import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import WebhookLogModel from "./model/WebhookLogModel.js";
import { fetchReplies } from "./controller/EmailController.js";
import { appRouter } from "./config/router.js";

// Load environment variables
dotenv.config();

// Initialize Express App
const app = express();

// Middleware
app.use(express.json()); // Parse JSON body
// Enable CORS
app.use(morgan("dev")); // Logging

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// connect db
connectDB();

// Initialize Passport
app.use(passport.initialize());

//Routes
appRouter(app);

// 🔔 Gmail Webhook Listener
app.post("/gmail/webhook", async (req, res) => {
  console.log("📩 New Gmail notification received!", req.body);

  // Giải mã base64 nếu cần
  const messageData = req.body.message?.data;
  let parsedData;
  if (messageData) {
    const buffer = Buffer.from(messageData, "base64");
    parsedData = JSON.parse(buffer.toString("utf-8"));
  }

  const historyId = parsedData?.historyId; // Lấy historyId từ dữ liệu webhook

  if (!historyId) {
    console.error("❌ Missing historyId in webhook payload", req.body);
    return res.status(400).json({ error: "Missing historyId" });
  }

  // ✅ Check nếu webhook này đã xử lý trước đó
  const existingLog = await WebhookLogModel.findOne({ historyId });

  if (existingLog) {
    console.log(`⚠️ Duplicate webhook detected, ignoring: ${historyId}`);
    return res.sendStatus(200); // Bỏ qua nếu là webhook trùng
  }

  try {
    await fetchReplies();

    // ✅ Lưu lại webhook log để tránh xử lý trùng
    await WebhookLogModel.create({ historyId });

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error processing Gmail webhook:", error);
    res.sendStatus(500);
  }
});

export default app; // Export app (without starting the server)
