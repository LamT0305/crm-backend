import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: String,
  message: String,
  status: { type: String, enum: ["Unread", "Read"] },
  createdAt: { type: Date, default: Date.now },
});
const NotificationModel = mongoose.model("Notification", NotificationSchema);
export default NotificationModel;
