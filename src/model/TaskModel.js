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
  priority: String,
  status: {
    type: String,
    enum: ["Backlog", "To do", "In Progress", "Completed", "Canceled"],
  },
});
const TaskModel = mongoose.model("Task", TaskSchema);
export default TaskModel;
