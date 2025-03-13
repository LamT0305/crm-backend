import EmailModel from "../model/EmailModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { oauth2Client, refreshAccessToken } from "../config/gmailConfig.js";
import { google } from "googleapis";
import { getEmailBody } from "../utils/extractEmailBody.js";
import UserModel from "../model/UserModel.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

const gmail = google.gmail({ version: "v1", auth: oauth2Client });
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory

export const sendEmail = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "User authentication failed." });
  }

  try {
    upload.any()(req, res, async (err) => {
      if (err)
        return res
          .status(500)
          .json({ error: "File upload failed", details: err });

      const { to, subject, message } = req.body;
      let attachments = [];

      if (!to || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Upload attachments to Cloudinary (if any)
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "auto", folder: "crm_attachments" },
              (error, result) => (error ? reject(error) : resolve(result))
            );
            stream.end(file.buffer);
          });

          attachments.push({
            filename: file.originalname,
            url: uploadResult.secure_url,
            mimetype: file.mimetype,
            public_id: uploadResult.public_id,
          });
        }
      }

      // Construct and send email (same as before)
      let emailBody = [
        `To: ${to}`,
        "From: me",
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        'Content-Type: multipart/mixed; boundary="boundary123"',
        "",
        "--boundary123",
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        message,
        "",
      ];

      for (const attachment of attachments) {
        emailBody.push(
          "--boundary123",
          `Content-Type: ${attachment.mimetype}; name="${attachment.filename}"`,
          "Content-Disposition: attachment",
          "",
          attachment.url,
          ""
        );
      }

      emailBody.push("--boundary123--");
      const rawMessage = Buffer.from(emailBody.join("\n"))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage },
      });

      // Save email with attachment links in the database
      const sentEmail = await EmailModel.create({
        userId: req.user.id,
        to,
        subject,
        message,
        status: "sent",
        threadId: response.data.threadId,
        sentAt: new Date(),
        attachments, // Store Cloudinary URLs
      });

      res
        .status(200)
        .json({
          success: true,
          message: "Email sent successfully!",
          email: sentEmail,
        });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getEmails = async (req, res) => {
  try {
    const { recipient } = req.body;
    const emails = await EmailModel.find({
      userId: req.user.id,
      to: recipient,
    })
      .populate("userId", "email name")
      .sort({ sentAt: -1 });
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

      await refreshAccessToken(user._id); // Refresh OAuth token

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

        // ✅ Check if the reply already exists
        if (await EmailModel.exists({ threadId, sentAt })) {
          console.log(`⚠️ Skipping duplicate reply: ${threadId}`);
          continue;
        }

        const headers = msgData.data.payload.headers;
        const subject =
          headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const from =
          headers.find((h) => h.name === "From")?.value || "Unknown Sender";
        const body = getEmailBody(msgData.data.payload);
        const attachments = await fetchAttachments(msgData.data);

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
            attachments,
          });

          console.log(`📩 Stored reply for user: ${existingSentEmail.userId}`);
        }
      }
    }

    console.log("✅ All replies fetched and stored.");
  } catch (error) {
    console.error("❌ Error fetching replies:", error);
  }
};

/**
 * Fetches email attachments and saves them locally
 */
const fetchAttachments = async (emailData) => {
  const attachments = [];
  if (!emailData.payload.parts) return attachments;

  // 🔧 Ensure "uploads" directory exists
  const uploadDir = path.join("uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // Create folder if it doesn't exist
  }

  for (const part of emailData.payload.parts) {
    if (!part.body || !part.body.attachmentId) continue;

    const attachmentData = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: emailData.id,
      id: part.body.attachmentId,
    });

    if (!attachmentData.data || !attachmentData.data.data) continue;

    const buffer = Buffer.from(attachmentData.data.data, "base64");
    const sanitizedFilename = part.filename.replace(/[^a-zA-Z0-9._-]/g, "_"); // Remove special characters
    const filePath = path.join(uploadDir, `${Date.now()}_${sanitizedFilename}`);

    fs.writeFileSync(filePath, buffer);

    attachments.push({
      filename: sanitizedFilename,
      path: filePath,
      mimetype: part.mimeType,
    });
  }

  return attachments;
};
