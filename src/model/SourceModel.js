import mongoose from "mongoose";
const SourceSchema = new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const SourceModel = mongoose.model("Source", SourceSchema);
export default SourceModel;
