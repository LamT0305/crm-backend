import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    content: {
      type: String,
      required: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    isGroupMessage: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        filename: String,
        path: String,
        mimetype: String,
        public_id: String,
      },
    ],
    messageType: {
      type: String,
      enum: ["message", "notification"],
      default: "message",
    },
  },
  {
    timestamps: true,
  }
);

const MessageModel = mongoose.model("Message", MessageSchema);
export default MessageModel;
