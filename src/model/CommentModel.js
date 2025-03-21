import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Customer",
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const CommentModel = mongoose.model("Comment", CommentSchema);
export default CommentModel;
