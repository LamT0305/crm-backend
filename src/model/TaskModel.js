import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
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
  description: String,
  dueDate: Date,
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
  },
  status: {
    type: String,
    enum: ["Backlog", "Todo", "InProgress", "Completed", "Canceled"],
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const TaskModel = mongoose.model("Task", TaskSchema);
export default TaskModel;
