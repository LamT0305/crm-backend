import mongoose from "mongoose";

const StatusSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ["deal", "contact"] },
  color: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const StatusModel = mongoose.model("Status", StatusSchema);
export default StatusModel;
