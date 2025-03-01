import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  content: String,
  messageType: { type: String, enum: ["SMS", "Email", "Call"] },
  status: { type: String, enum: ["Sent", "Delivered", "Failed", "Read"] },
  timestamp: { type: Date, default: Date.now },
});
const MessageModel = mongoose.model("Message", MessageSchema);

export default MessageModel;
