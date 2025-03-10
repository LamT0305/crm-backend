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
app.use(cors());
app.use(express.urlencoded({ extended: true }));
// connect db
connectDB();

// Initialize Passport
app.use(passport.initialize());

//Routes
appRouter(app);

// 🔔 Gmail Webhook Listener
app.post("/gmail/webhook", async (req, res) => {
  console.log("📩 New Gmail notification received!", req.body);

  // Decode Base64 payload (if available)
  const messageData = req.body.message?.data;
  let parsedData;
  if (messageData) {
    const buffer = Buffer.from(messageData, "base64");
    parsedData = JSON.parse(buffer.toString("utf-8"));
  }

  const historyId = parsedData?.historyId;
  if (!historyId) {
    console.error("❌ Missing historyId in webhook payload", req.body);
    return res.status(400).json({ error: "Missing historyId" });
  }

  try {
    // ✅ Check if this webhook has already been processed
    const isDuplicate = await WebhookLogModel.exists({ historyId });
    if (isDuplicate) {
      console.log(`⚠️ Duplicate webhook detected, ignoring: ${historyId}`);
      return res.sendStatus(200);
    }

    // ✅ Store webhook log before processing (prevents race conditions)
    await WebhookLogModel.create({ historyId });

    // ✅ Process Gmail replies asynchronously (avoids blocking webhook response)
    await fetchReplies()
      .then(() =>
        console.log(`📨 Processed emails for historyId: ${historyId}`)
      )
      .catch((error) => console.error("❌ Error fetching replies:", error));

    res.sendStatus(200); // Respond immediately while processing continues in background
  } catch (error) {
    console.error("❌ Error processing Gmail webhook:", error);
    res.sendStatus(500);
  }
});

export default app; 
