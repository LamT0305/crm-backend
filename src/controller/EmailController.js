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

    const emails = await EmailModel.find({
      userId: req.user.id,
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

export const fetchReplies = async () => {
  try {
    const users = await UserModel.find().lean();
    await Promise.all(
      users.map(async (user) => {
        try {
          await refreshAccessToken(user._id);
          const messagesList = await gmail.users.messages
            .list({
              userId: "me",
              q: "in:inbox OR in:sent newer_than:1d",
              maxResults: 50,
            })
            .catch((error) => {
              console.error(
                `Failed to fetch messages for ${user.email}:`,
                error
              );
              return null;
            });

          if (!messagesList?.data?.messages) {
            console.log(`No messages found for user: ${user.email}`);
            return;
          }

          await Promise.all(
            messagesList.data.messages.map(async (msg) => {
              try {
                if (!msg.id) {
                  console.log("⚠️ Invalid message ID, skipping...");
                  return;
                }

                const msgData = await gmail.users.messages
                  .get({
                    userId: "me",
                    id: msg.id,
                    format: "full",
                  })
                  .catch((error) => {
                    if (error.code === 404) {
                      console.log(
                        `⚠️ Message ${msg.id} not found in Gmail, skipping...`
                      );
                      return null;
                    }
                    throw error;
                  });

                if (!msgData?.data?.payload?.headers) {
                  console.log(`⚠️ Invalid message data for ID: ${msg.id}`);
                  return;
                }

                const messageId = msgData.data.id;
                const headers = msgData.data.payload.headers;
                const from =
                  headers.find((h) => h.name === "From")?.value ||
                  "Unknown Sender";
                const to =
                  headers.find((h) => h.name === "To")?.value ||
                  "Unknown Recipient";
                const senderEmail = extractEmailAddress(from);
                const recipientEmail = extractEmailAddress(to);

                // First check if the sender is a customer in our system
                const customer = await CustomerModel.findOne({
                  email: senderEmail,
                }).lean();

                // Skip if sender is not a customer
                if (!customer) {
                  console.log(
                    `⚠️ Skipping email from non-customer: ${senderEmail}`
                  );
                  return;
                }

                const existingEmail = await EmailModel.findOne({
                  messageId,
                }).lean();

                if (existingEmail) {
                  console.log(
                    `⚠️ Skipping already processed email: ${messageId}`
                  );
                  return;
                }

                const subject =
                  headers.find((h) => h.name === "Subject")?.value ||
                  "No Subject";
                const threadId = msgData.data.threadId;
                const sentAt = new Date(parseInt(msgData.data.internalDate));
                const body = getEmailBody(msgData.data.payload);
                const attachments = await fetchAttachments(msgData.data).catch(
                  (error) => {
                    console.error(
                      `Error fetching attachments for message ${messageId}:`,
                      error
                    );
                    return [];
                  }
                );

                const newEmail = await EmailModel.create({
                  userId: user._id,
                  to: senderEmail,
                  subject,
                  message: body,
                  status: "received",
                  threadId,
                  messageId,
                  sentAt,
                  attachments,
                  isDeleted: false,
                  workspace: customer.workspace,
                });

                await handleNewEmail(newEmail, customer);

                console.log(
                  `📩 Stored incoming email from customer: ${customer.email}`
                );
              } catch (error) {
                if (error.code === 404) {
                  console.log(`⚠️ Message ${msg.id} not found, skipping...`);
                  return;
                }
                console.error(`Error processing message ${msg.id}:`, error);

                const io = getIO();
                io.emit("gmail_error", {
                  error: error.message,
                  messageId: msg.id,
                  status: error.code || 500,
                });
              }
            })
          );
        } catch (error) {
          console.error(`Error processing user ${user.email}:`, error);
        }
      })
    );
    console.log("✅ All messages processed.");
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
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
      workspace: email.workspace,
      link: `${process.env.FRONTEND_URL}/customerinfo/${customer._id}`,
    });

    await notification.populate("userId", "email name");

    // Emit to specific user's room with notification data
    io.to(`user_${email.userId}`).emit("newEmail", {
      notification,
      email: {
        id: email._id,
        subject: email.subject,
        from: email.to,
        customerId: customer._id,
      },
    });

    console.log(`📧 Emitted new email notification to user ${email.userId}`);
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
export const sendInvitationEmail = async ({ email, subject, message }) => {
  try {
    const emailBody = createEmailBody(email, subject, message);

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
