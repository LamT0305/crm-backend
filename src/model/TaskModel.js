import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: String,
  description: String,
  dueDate: Date,
  priority: String,
  status: { type: String, enum: ["Pending", "In Progress", "Completed"] },
});
const TaskModel = mongoose.model("Task", TaskSchema);
export default TaskModel;
