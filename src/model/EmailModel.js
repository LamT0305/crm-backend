import mongoose from "mongoose";

const EmailSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["sent", "received"], required: true },
  threadId: { type: String, required: true },
  sentAt: { type: Date, required: true },
  messageId: { type: String, required: true },
  attachments: [
    {
      filename: String,
      path: String,
      mimetype: String,
      public_id: String,
    },
  ],
  isDeleted: { type: Boolean, default: false },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
});

// ✅ Prevent duplicate emails with the same threadId and sentAt
EmailSchema.index({ threadId: 1, sentAt: 1 }, { unique: true });

const EmailModel = mongoose.model("Email", EmailSchema);

export default EmailModel;
