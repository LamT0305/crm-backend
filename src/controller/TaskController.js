import NotificationModel from "../model/NotificationModel.js";
import TaskModel from "../model/TaskModel.js";
import UserModel from "../model/UserModel.js";
import { getIO } from "../socket.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";
import { sendAssignTaskEmail } from "./EmailController.js";

export const createTask = async (req, res) => {
  try {
    const {
      customerId,
      title,
      description,
      dueDate,
      priority,
      status,
      assignee,
    } = req.body;

    if (
      !customerId ||
      !title ||
      !description ||
      !dueDate ||
      !priority ||
      !status ||
      !assignee
    ) {
      return errorResponse(res, "All fields are required", 400);
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
      return errorResponse(res, "Invalid priority level", 400);
    }

    if (
      !["Backlog", "Todo", "InProgress", "Completed", "Canceled"].includes(
        status
      )
    ) {
      return errorResponse(res, "Invalid status", 400);
    }

    const task = await TaskModel.create({
      userId: req.user.id,
      assignee: assignee,
      customerId,
      title,
      description,
      dueDate: new Date(new Date(dueDate).toLocaleDateString("en-US")),
      priority,
      status,
      workspace: req.workspaceId,
      createdAt: new Date(),
    });

    const populatedTask = await task.populate([
      { path: "userId", select: "name email" },
      {
        path: "assignee",
        select: "name email",
      },
      { path: "customerId", select: "firstName lastName email" },
    ]);

    if (assignee !== req.user.id) {
      const assigneeUser = await UserModel.findById(assignee);
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return errorResponse(res, "User not found", 404);
      }
      if (!assigneeUser) {
        return errorResponse(res, "Assignee not found", 404);
      }
      await sendAssignTaskEmail(user, {
        email: assigneeUser.email,
        subject: "Task Assigned",
        message: `You have been assigned a new task: ${title}`,
        link: `${process.env.FRONTEND_URL}/customerinfo/${customerId}`,
      });
      const noti = await NotificationModel.create({
        userId: req.user.id,
        workspace: req.workspaceId,
        title: "New Task Assigned",
        message: `You have been assigned a new task: ${title}`,
        link: `${process.env.FRONTEND_URL}/customerinfo/${customerId}`,
      });

      const io = getIO();
      io.to(assignee).emit("new_task", noti);
    }

    successResponse(res, populatedTask);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, assignee } =
      req.body;

    if (
      !title ||
      !description ||
      !dueDate ||
      !priority ||
      !status ||
      !assignee
    ) {
      return errorResponse(res, "All fields are required", 400);
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
      return errorResponse(res, "Invalid priority level", 400);
    }

    if (
      !["Backlog", "Todo", "InProgress", "Completed", "Canceled"].includes(
        status
      )
    ) {
      return errorResponse(res, "Invalid status", 400);
    }

    const task = await TaskModel.findOneAndUpdate(
      {
        _id: req.params.id,
        workspace: req.workspaceId,
      },
      {
        title,
        description,
        assignee: assignee,
        dueDate: new Date(new Date(dueDate).toLocaleDateString("en-US")),
        priority,
        status,
      },
      { new: true }
    ).populate([
      { path: "userId", select: "name email" },
      {
        path: "assignee",
        select: "name email",
      },
      { path: "customerId", select: "firstName lastName email" },
    ]);

    if (!task) {
      return errorResponse(res, "Task not found", 404);
    }

    if (assignee !== req.user.id) {
      if (assignee !== task.assignee) {
        const assigneeUser = await UserModel.findById(assignee);
        if (!assigneeUser) {
          return errorResponse(res, "Assignee not found", 404);
        }
        const user = await UserModel.findById(req.user.id);
        if (!user) {
          return errorResponse(res, "User not found", 404);
        }
        await sendAssignTaskEmail(user, {
          email: assigneeUser.email,
          subject: "Task Assigned",
          message: `You have been assigned a new task: ${title}`,
          link: `${process.env.FRONTEND_URL}/customerinfo/${task.customerId}`,
        });

        const noti = await NotificationModel.create({
          userId: req.user.id,
          workspace: req.workspaceId,
          title: "New Task Assigned",
          message: `You have been assigned a new task: ${title}`,
          link: `${process.env.FRONTEND_URL}/customerinfo/${task.customerId}`,
        });

        const io = getIO();
        io.to(assignee).emit("new_task", noti);
      }
    }

    successResponse(res, task);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getAllTasksByUser = async (req, res) => {
  try {
    const tasks = await TaskModel.find({
      userId: req.user.id,
      workspace: req.workspaceId,
    })
      .populate("userId", "name email")
      .populate("customerId", "firstName lastName email")
      .sort({ createdAt: -1 });

    successResponse(res, tasks);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getTasksBetweenUserAndCustomer = async (req, res) => {
  try {
    const tasks = await TaskModel.find({
      customerId: req.params.id,
      workspace: req.workspaceId,
    })
      .populate("userId", "name email")
      .populate("assignee", "name email")
      .populate("customerId", "firstName lastName email")
      .sort({ createdAt: -1 });

    successResponse(res, tasks);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await TaskModel.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!task) {
      return errorResponse(res, "Task not found", 404);
    }

    successResponse(res, { message: "Task deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await TaskModel.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    })
      .populate("userId", "name email")
      .populate("assignee", "name email")
      .populate("customerId", "firstName lastName email");

    if (!task) {
      return errorResponse(res, "Task not found", 404);
    }

    successResponse(res, task);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
