import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  statusId: { type: mongoose.Schema.Types.ObjectId, ref: "Status" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CustomerModel = mongoose.model("Customer", CustomerSchema);

export default CustomerModel;
