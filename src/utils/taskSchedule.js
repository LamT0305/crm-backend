import cron from "node-cron";
import TaskModel from "../model/TaskModel.js";
import NotificationModel from "../model/NotificationModel.js";
import { getIO } from "../socket.js";

export const initializeTaskScheduler = () => {
  // Run every hour to check for overdue tasks
  cron.schedule("0 * * * *", async () => {
    try {
      // Find all tasks that are:
      // 1. Not completed or canceled
      // 2. Due date is in the past
      const overdueTasks = await TaskModel.find({
        status: { $nin: ["Completed", "Canceled"] },
        dueDate: { $lt: new Date() },
      }).populate([
        { path: "assignee", select: "name email" },
        { path: "customerId", select: "firstName lastName" },
      ]);

      for (const task of overdueTasks) {
        // Create notification for overdue task
        const notification = await NotificationModel.create({
          userId: task.assignee,
          workspace: task.workspace,
          title: "Task Overdue",
          message: `Task "${
            task.title
          }" is overdue. Due date was ${task.dueDate.toLocaleDateString()}`,
          link: `${process.env.FRONTEND_URL}/customerinfo/${task.customerId}`,
        });

        // Send real-time notification via socket
        const io = getIO();
        io.to(`user_${task.assignee}`).emit("task_overdue", notification);

        // Update task status to reflect it's overdue
        await TaskModel.findByIdAndUpdate(task._id, {
          $set: { status: "Overdue" },
        });
      }
    } catch (error) {
      console.error("Task scheduler error:", error);
    }
  });
};
