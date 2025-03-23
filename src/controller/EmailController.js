import EmailModel from "../model/EmailModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { oauth2Client, refreshAccessToken } from "../config/gmailConfig.js";
import { google } from "googleapis";
import { getEmailBody } from "../utils/extractEmailBody.js";
import UserModel from "../model/UserModel.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import { getIO } from "../socket.js";
import NotificationModel from "../model/NotificationModel.js";
import CustomerModel from "../model/CustomerModel.js";

const gmail = google.gmail({ version: "v1", auth: oauth2Client });
const upload = multer({ storage: multer.memoryStorage() });

export const sendEmail = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "User authentication failed." });
  }

  try {
    upload.any()(req, res, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "File upload failed", details: err });
      }

      const { to, subject, message } = req.body;
      let attachments = [];

      if (!to || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      let emailBody = [
        `To: ${to}`,
        "From: me",
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        'Content-Type: multipart/mixed; boundary="boundary123"',
        "",
        "--boundary123",
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: 7bit",
        "",
        message,
        "",
      ];

      // Handle attachments using original file buffer
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          // First, add the file to email body
          const base64Data = file.buffer.toString("base64");
          emailBody.push(
            "--boundary123",
            `Content-Type: ${file.mimetype}`,
            "Content-Transfer-Encoding: base64",
            `Content-Disposition: attachment; filename="${file.originalname}"`,
            "",
            base64Data,
            ""
          );

          // Then upload to Cloudinary for storage
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "auto", folder: "crm_attachments" },
              (error, result) => (error ? reject(error) : resolve(result))
            );
            stream.end(file.buffer);
          });

          attachments.push({
            filename: file.originalname,
            path: uploadResult.secure_url,
            mimetype: file.mimetype,
            public_id: uploadResult.public_id,
          });
        }
      }

      emailBody.push("--boundary123--");

      const rawMessage = Buffer.from(emailBody.join("\n"))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: rawMessage },
      });

      const sentEmail = await EmailModel.create({
        userId: req.user.id,
        to,
        subject,
        message,
        status: "sent",
        threadId: response.data.threadId,
        sentAt: new Date(),
        attachments,
      });

      await sentEmail.populate("userId", "email name");

      res.status(200).json({
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
    res.status(200).json({ message: "Success", emails: emails });
  } catch (error) {
    errorResponse(res, "Could not retrieve emails", error);
  }
};

export const fetchReplies = async () => {
  try {
    const users = await UserModel.find();

    for (const user of users) {
      console.log(`🔄 Refreshing token for user: ${user.email}`);

      await refreshAccessToken(user._id);

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

        // Extract email from the "from" field
        const emailRegex = /<([^>]+)>/;
        const emailMatch = from.match(emailRegex);
        const senderEmail = emailMatch ? emailMatch[1] : from;

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

          // add notification real-time

          await handleNewEmail(existingSentEmail.userId, {
            from,
            subject,
            threadId,
          });

          console.log(`📩 Stored reply for user: ${existingSentEmail.userId}`);
        } else {
          // Check if sender is an existing customer
          const customer = await CustomerModel.findOne({ email: senderEmail });

          if (customer) {
            // Store new email from customer
            await EmailModel.create({
              userId: user._id,
              to: customer.email,
              subject,
              message: body,
              status: "received",
              threadId,
              sentAt,
              attachments,
            });

            await handleNewEmail(user._id, {
              from,
              subject,
              threadId,
            });

            console.log(`📨 Stored new email from customer: ${senderEmail}`);
          } else {
            console.log(`⚠️ Skipping email from non-customer: ${senderEmail}`);
          }
        }
      }
    }

    console.log("✅ All replies fetched and stored.");
  } catch (error) {
    console.error("❌ Error fetching replies:", error);
  }
};

const fetchAttachments = async (emailData) => {
  const attachments = [];
  if (!emailData.payload.parts) return attachments;

  for (const part of emailData.payload.parts) {
    if (!part.body || !part.body.attachmentId) continue;

    const attachmentData = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: emailData.id,
      id: part.body.attachmentId,
    });

    if (!attachmentData.data || !attachmentData.data.data) continue;

    const buffer = Buffer.from(attachmentData.data.data, "base64");
    const sanitizedFilename = part.filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "crm_attachments" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
      });

      attachments.push({
        filename: sanitizedFilename,
        path: uploadResult.secure_url, // Add this field
        url: uploadResult.secure_url, // Keep this for backward compatibility
        mimetype: part.mimeType,
        public_id: uploadResult.public_id,
      });
    } catch (error) {
      console.error(
        `❌ Error uploading attachment: ${sanitizedFilename}`,
        error
      );
    }
  }

  return attachments;
};

export const handleNewEmail = async (userId, emailData) => {
  try {
    const io = getIO();

    // Extract email address from the "from" field
    const emailRegex = /<([^>]+)>/;
    const emailMatch = emailData.from.match(emailRegex);
    const emailAddress = emailMatch ? emailMatch[1] : emailData.from;

    // Create notification for new email with just the email address
    const notification = await NotificationModel.create({
      userId,
      message: `${emailAddress} has sent an email`,
      title: `New Email: ${emailData.subject}`,
      status: "Unread",
      type: "email",
    });

    await notification.populate("userId", "email name");

    const customer = await CustomerModel.findOne({ email: emailAddress });
    if (customer) {
      // Emit to specific user's room
      io.to(`user_${userId}`).emit("newEmail", {
        type: "email",
        data: {
          notification,
          customerId: customer._id,
        },
      });

      io.to(`user_${userId}`).emit("updateEmails", {
        customerId: customer._id,
      });
    }

    return notification;
  } catch (error) {
    console.error("Error handling new email notification:", error);
    throw error;
  }
};

export const handleDeleteEmail = async (req, res) => {
  try {
    const emailId = req.params.id;
    const email = await EmailModel.findById(emailId);
    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }
    // Delete attachments from Cloudinary
    for (const attachment of email.attachments) {
      await cloudinary.uploader.destroy(attachment.public_id);
    }
    // Delete the email from the database
    await EmailModel.findByIdAndDelete(emailId);
    return res.status(200).json({ message: "Email deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error", error });
  }
};
