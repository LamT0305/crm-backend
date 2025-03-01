import mongoose from "mongoose";
const DealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  title: String,
  amount: Number,
  statusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Status",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const DealModel = mongoose.model("Deal", DealSchema);

export default DealModel;
