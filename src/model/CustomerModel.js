import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  gender: { type: String, required: true },
  status: {
    type: String,
    enum: ["lead", "customer"],
    default: "lead",
  },
  deals: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
    },
  ],
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Source",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CustomerModel = mongoose.model("Customer", CustomerSchema);
export default CustomerModel;
