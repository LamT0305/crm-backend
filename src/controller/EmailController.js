import EmailModel from "../model/EmailModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import {
  refreshAccessToken,
  createOAuth2ClientForUser,
} from "../config/gmailConfig.js";
import { google } from "googleapis";
import { getEmailBody } from "../utils/extractEmailBody.js";
import UserModel from "../model/UserModel.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";
import { getIO } from "../socket.js";
import NotificationModel from "../model/NotificationModel.js";
import CustomerModel from "../model/CustomerModel.js";
import { listRecentInboxMessages } from "../utils/recentInbox.js";

const upload = multer({ storage: multer.memoryStorage() });

const extractEmailAddress = (from) => {
  const emailRegex = /<([^>]+)>/;
  const emailMatch = from.match(emailRegex);
  return emailMatch ? emailMatch[1] : from;
};

const uploadToCloudinary = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "crm_attachments" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

const createEmailBody = (to, subject, message, files = []) => {
  const emailBody = [
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

  files.forEach((file) => {
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
  });

  emailBody.push("--boundary123--");
  return emailBody;
};

export const sendEmail = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "User authentication failed." });
    }

    upload.any()(req, res, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "File upload failed", details: err });
      }

      const { to, subject, message } = req.body;
      if (!to || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const user = await UserModel.findById(req.user.id);
      const client = createOAuth2ClientForUser(user);
      const gmail = google.gmail({ version: "v1", auth: client });

      const attachments = [];
      const emailBody = createEmailBody(to, subject, message, req.files);

      if (req.files?.length > 0) {
        await Promise.all(
          req.files.map(async (file) => {
            try {
              const uploadResult = await uploadToCloudinary(
                file.buffer,
                file.originalname
              );
              attachments.push({
                filename: file.originalname,
                path: uploadResult.secure_url,
                mimetype: file.mimetype,
                public_id: uploadResult.public_id,
              });
            } catch (error) {
              console.error(
                `Error uploading attachment: ${file.originalname}`,
                error
              );
            }
          })
        );
      }

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
        messageId: response.data.id,
        sentAt: new Date(),
        attachments,
        isDeleted: false,
        workspace: req.workspaceId,
      });

      await sentEmail.populate([{ path: "userId", select: "email name" }]);

      res.status(200).json({
        success: true,
        message: "Email sent successfully!",
        email: sentEmail,
      });
    });
  } catch (error) {
    console.error("Send email error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getEmails = async (req, res) => {
  try {
    const customer = await CustomerModel.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // await fetchReplies();

    const emails = await EmailModel.find({
      workspace: req.workspaceId,
      to: customer.email,
      isDeleted: { $ne: true },
    })
      .populate("userId", "email name")
      .sort({ sentAt: -1 })
      .lean();

    successResponse(res, { emails, total: emails.length });
  } catch (error) {
    console.error("Get emails error:", error);
    errorResponse(res, "Could not retrieve emails", error);
  }
};

export const fetchReplies = async (user, historyIdFromWebhook) => {
  try {
    await refreshAccessToken(user._id);
    const freshUser = await UserModel.findById(user._id);
    const client = createOAuth2ClientForUser(freshUser);
    const gmail = google.gmail({ version: "v1", auth: client });

    console.log("🔍 Fetching emails with historyId:", historyIdFromWebhook);

    const history = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyIdFromWebhook,
      labelId: "INBOX",
      maxResults: 100,
    });

    const historyList = history.data.history || [];
    const addedMessages = historyList
      .flatMap((h) => {
        const messages = [];
        if (h.messages) messages.push(...h.messages);
        if (h.messagesAdded)
          messages.push(...h.messagesAdded.map((m) => m.message));
        if (h.labelsAdded) {
          const inboxMessages = h.labelsAdded
            .filter((l) => l.labelIds.includes("INBOX"))
            .map((l) => l.message);
          messages.push(...inboxMessages);
        }
        return messages;
      })
      .filter((m) => m && m.id);

    let messagesToProcess = addedMessages;

    // 🔁 Fallback if no messages found in history
    if (!messagesToProcess || messagesToProcess.length === 0) {
      console.warn(
        "⚠️ No messages found in history, falling back to inbox scan"
      );
      messagesToProcess = await listRecentInboxMessages(gmail, 10); // Grab last 10
    }

    for (const msg of messagesToProcess) {
      try {
        const msgData = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const headers = msgData.data.payload.headers;
        const fromHeader = headers.find((h) => h.name === "From");
        const senderEmail = extractEmailAddress(fromHeader?.value || "");

        const customer = await CustomerModel.findOne({
          email: senderEmail,
          workspace: { $exists: true },
        });

        if (!customer) {
          console.log("⚠️ No customer found for email:", senderEmail);
          continue;
        }

        const exists = await EmailModel.findOne({
          messageId: msg.id,
          workspace: customer.workspace,
        });

        if (exists) {
          console.log("⚠️ Email already exists:", msg.id);
          continue;
        }

        const subject =
          headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const body = getEmailBody(msgData.data.payload);
        const attachments = await fetchAttachments(msgData.data);

        const newEmail = await EmailModel.create({
          userId: user._id,
          to: senderEmail,
          subject,
          message: body,
          status: "received",
          threadId: msgData.data.threadId,
          messageId: msg.id,
          sentAt: new Date(Number(msgData.data.internalDate)),
          attachments,
          isDeleted: false,
          workspace: customer.workspace,
        });

        await handleNewEmail(newEmail, customer);
        console.log("✅ Email processed successfully:", msg.id);
      } catch (err) {
        console.error("❌ Error processing message:", err);
      }
    }

    await UserModel.findByIdAndUpdate(user._id, {
      lastHistoryId: historyIdFromWebhook,
    });
  } catch (err) {
    console.error("❌ Error in fetchReplies:", err);
    throw err;
  }
};

const fetchAttachments = async (emailData) => {
  if (!emailData.payload.parts) return [];

  const attachmentPromises = emailData.payload.parts
    .filter((part) => part.body?.attachmentId)
    .map(async (part) => {
      try {
        const attachmentData = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId: emailData.id,
          id: part.body.attachmentId,
        });

        if (!attachmentData.data?.data) return null;

        const buffer = Buffer.from(attachmentData.data.data, "base64");
        const sanitizedFilename = part.filename.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );
        const uploadResult = await uploadToCloudinary(
          buffer,
          sanitizedFilename
        );

        return {
          filename: sanitizedFilename,
          path: uploadResult.secure_url,
          mimetype: part.mimeType,
          public_id: uploadResult.public_id,
        };
      } catch (error) {
        console.error(`Error processing attachment: ${part.filename}`, error);
        return null;
      }
    });

  const results = await Promise.all(attachmentPromises);
  return results.filter(Boolean);
};

export const handleNewEmail = async (email, customer) => {
  try {
    const io = getIO();

    const notification = await NotificationModel.create({
      userId: email.userId,
      message: `New email received from ${email.to}`,
      title: `New Email: ${email.subject}`,
      status: "Unread",
      type: "email",
      link: `${process.env.FRONTEND_URL}/customerinfo/${customer._id}`,
      workspace: email.workspace,
    });

    await notification.populate("userId", "email name");

    io.to(`user_${email.userId}`).emit("newEmail", {
      type: "email",
      data: { notification, customerId: customer._id },
    });

    io.to(`user_${email.userId}`).emit("updateEmails", {
      customerId: customer._id,
    });

    return notification;
  } catch (error) {
    console.error("Error handling new email notification:", error);
    throw error;
  }
};

export const handleDeleteEmail = async (req, res) => {
  try {
    const email = await EmailModel.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    }).lean();

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    await Promise.all(
      email.attachments.map((attachment) =>
        cloudinary.uploader.destroy(attachment.public_id)
      )
    );

    await EmailModel.findOneAndUpdate(
      {
        _id: req.params.id,
        workspace: req.workspaceId,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Email deleted successfully",
    });
  } catch (error) {
    console.error("Delete email error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

// Add this new function at the top of the file, after the imports
export const sendInvitationEmail = async (
  user,
  { email, subject, message, link }
) => {
  try {
    const client = createOAuth2ClientForUser(user);
    const gmail = google.gmail({ version: "v1", auth: client });

    // Create a more professional HTML email template
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .content {
              background-color: #ffffff;
              padding: 20px;
              border-radius: 5px;
              border: 1px solid #e9ecef;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #0066cc;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #0052a3;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              font-size: 12px;
              color: #6c757d;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0; color: #0066cc;">${subject}</h2>
          </div>
          <div class="content">
            <p>${message}</p>
            <div style="text-align: center;">
              <a href="${link}" class="button" style="color: #ffffff;">Accept Invitation</a>
            </div>
            <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #666;">${link}</p>
          </div>
          <div class="footer">
            <p>This is an automated invitation from your CRM system</p>
            <p>If you didn't expect this invitation, please ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    const emailBody = [
      `To: ${email}`,
      "From: me",
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="boundary123"',
      "",
      "--boundary123",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      `${message}\n\nClick here to accept the invitation: ${link}`, // Plain text version
      "",
      "--boundary123",
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      htmlBody,
      "",
      "--boundary123--",
    ];

    const rawMessage = Buffer.from(emailBody.join("\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: rawMessage },
    });

    return true;
  } catch (error) {
    console.error("Send invitation email error:", error);
    throw error;
  }
};

// create email to send assign task to user
export const sendAssignTaskEmail = async (
  user,
  { email, subject, message, link }
) => {
  try {
    const client = createOAuth2ClientForUser(user);
    const gmail = google.gmail({ version: "v1", auth: client });
    // Create a more professional HTML email template
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .notification-card {
              background-color: #ffffff;
              border: 1px solid #e1e4e8;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
              padding: 20px;
            }
            .notification-header {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 1px solid #e1e4e8;
            }
            .notification-icon {
              background-color: #0066cc;
              color: white;
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              font-size: 20px;
            }
            .notification-title {
              color: #24292e;
              font-size: 18px;
              font-weight: 600;
              margin: 0;
            }
            .notification-content {
              color: #444d56;
              margin: 15px 0;
            }
            .action-button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #0066cc;
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin-top: 15px;
            }
            .action-button:hover {
              background-color: #0052a3;
            }
            .notification-footer {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 1px solid #e1e4e8;
              color: #6a737d;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="notification-card">
            <div class="notification-header">
              <div class="notification-icon">📋</div>
              <h2 class="notification-title">${subject}</h2>
            </div>
            <div class="notification-content">
              ${message}
            </div>
            <div style="text-align: left;">
              <a href="${link}" class="action-button">View Task Details</a>
            </div>
            <div class="notification-footer">
              <p>This is an automated notification from LeadMaster CRM</p>
              <p>If you weren't expecting this notification, please contact your workspace administrator.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    const emailBody = [
      `To: ${email}`,
      "From: me",
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: multipart/alternative; boundary="boundary123"',
      "",
      "--boundary123",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      `${message}\n\nView your assigned task here: ${link}`,
      "",
      "--boundary123",
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      htmlBody,
      "",
      "--boundary123--",
    ];
    const rawMessage = Buffer.from(emailBody.join("\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: rawMessage },
    });
    return true;
  } catch (error) {
    console.error("Send invitation email error:", error);
    throw error;
  }
};
