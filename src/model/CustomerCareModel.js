import mongoose from "mongoose";

const CustomerCareSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Who handled the interaction
  type: {
    type: String,
    enum: [
      "Call",
      "Email",
      "Meeting",
      "Follow-up-Sale", // Following up after a sale
      "Follow-up-Issue", // Following up after resolving an issue
      "Follow-up-Meeting", // Following up after a meeting
      "Follow-up-Quote", // Following up on a quotation
    ],
    required: true,
  },
  notes: { type: String, required: true },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CustomerCareModel = mongoose.model("CustomerCare", CustomerCareSchema);
export default CustomerCareModel;
