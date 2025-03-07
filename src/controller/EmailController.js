import EmailModel from "../model/EmailModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { oauth2Client, refreshAccessToken } from "../config/gmailConfig.js";
import { google } from "googleapis";
import { getEmailBody } from "../utils/extractEmailBody.js";
import UserModel from "../model/UserModel.js";

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

export const sendEmail = async (req, res) => {
  console.log("🔍 Debugging req.user:", req.user); // Check if req.user exists
  if (!req.user || !req.user._id) {
    return res
      .status(400)
      .json({ error: "User authentication failed. userId is missing." });
  }
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const rawMessage = [
      `To: ${to}`,
      "From: me",
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "",
      message,
    ].join("\n");

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    // Store sent email in the database
    const sentEmail = await EmailModel.create({
      userId: req.user._id, // CRM user who sent the email
      to,
      subject,
      message,
      status: "sent",
      threadId: response.data.threadId, // Store Gmail's threadId for tracking replies
      sentAt: new Date(),
    });

    res.json({
      success: true,
      message: "Email sent successfully!",
      email: sentEmail,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getEmails = async (req, res) => {
  try {
    const { recipient } = req.body;
    const emails = await EmailModel.find({
      userId: req.user._id,
      to: recipient,
    });
    // successResponse(res, emails);
    res.status(200).json({ message: "Success", emails: emails });
  } catch (error) {
    errorResponse(res, "Could not retrieve emails", error);
  }
};

export const fetchReplies = async () => {
  try {
    const users = await UserModel.find(); // Get all users from DB

    for (const user of users) {
      console.log(`🔄 Refreshing token for user: ${user.email}`);

      // Refresh token
      await refreshAccessToken(user._id);

      // Fetch inbox emails from Gmail
      const messagesList = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["INBOX"],
        maxResults: 20,
      });

      if (!messagesList.data.messages) {
        console.log(`📭 No new replies for user: ${user.email}`);
        continue;
      }

      for (const msg of messagesList.data.messages) {
        const msgData = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });

        const threadId = msgData.data.threadId;
        const sentAt = new Date(parseInt(msgData.data.internalDate));

        // ✅ Check if this reply is already stored
        const existingReply = await EmailModel.findOne({ threadId, sentAt });

        if (existingReply) {
          console.log(`⚠️ Duplicate reply detected, skipping: ${threadId}`);
          continue; // Skip storing duplicate replies
        }

        const headers = msgData.data.payload.headers;
        const subject =
          headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const from =
          headers.find((h) => h.name === "From")?.value || "Unknown Sender";
        const body = getEmailBody(msgData.data.payload);

        const existingSentEmail = await EmailModel.findOne({ threadId });

        if (existingSentEmail) {
          await EmailModel.create({
            userId: existingSentEmail.userId,
            to: existingSentEmail.to,
            subject,
            message: body,
            status: "received",
            threadId,
            sentAt,
          });

          console.log(`📩 Stored reply for ${existingSentEmail.userId}`);
        }
      }
    }

    console.log("✅ All replies fetched and stored.");
  } catch (error) {
    console.error("❌ Error fetching replies:", error);
  }
};
