import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
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
    type: {
      type: String,
      enum: ["comment", "task", "note", "email", "customer", "deal"],
      required: true,
    }, // Loại hoạt động
    subject: { type: String, required: true }, // Tiêu đề
  },
  { timestamps: true }
);

const ActivityModel = mongoose.model("Activity", ActivitySchema);
export default ActivityModel;
