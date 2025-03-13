import mongoose from "mongoose";

const WebhookLogSchema = new mongoose.Schema({
  historyId: { type: String, required: true, unique: true }, // Unique Gmail webhook history ID
  processedAt: { type: Date, default: Date.now },
});

const WebhookLogModel = mongoose.model("WebhookLog", WebhookLogSchema);

export default WebhookLogModel;
