import mongoose from "mongoose";

const CallLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    callType: {
      type: String,
      enum: ["incoming", "outgoing", "missed"],
      required: true,
    }, 
    duration: { type: Number, required: true }, 
    callStatus: {
      type: String,
      enum: ["completed", "failed", "missed"],
      default: "completed",
    }, 
    notes: { type: String }, 
    recordedUrl: { type: String }, // Link file ghi âm (nếu có)
    timestamp: { type: Date, default: Date.now }, // Thời gian cuộc gọi diễn ra
  }
);

const CallLogModel = mongoose.model("CallLog", CallLogSchema);
export default CallLogModel;
