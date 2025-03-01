import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: String,
  email: String,
  phone: String,
  company: String,
  statusId: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CustomerModel = mongoose.model("Customer", CustomerSchema);

export default CustomerModel;
