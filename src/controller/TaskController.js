import TaskModel from "../model/TaskModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const createTask = async (req, res) => {
  try {
    const { customerId, title, description, dueDate, priority, status } =
      req.body;

    if (
      !customerId ||
      !title ||
      !description ||
      !dueDate ||
      !priority ||
      !status
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
      customerId,
      title,
      description,
      dueDate: new Date(dueDate),
      priority,
      status,
      workspace: req.workspaceId,
      createdAt: new Date(),
    });

    const populatedTask = await task.populate([
      { path: "userId", select: "name email" },
      { path: "customerId", select: "firstName lastName email" },
    ]);

    successResponse(res, populatedTask);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, status } = req.body;

    if (!title || !description || !dueDate || !priority || !status) {
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
        dueDate: new Date(dueDate),
        priority,
        status,
        createdAt: new Date(),
      },
      { new: true }
    ).populate([
      { path: "userId", select: "name email" },
      { path: "customerId", select: "firstName lastName email" },
    ]);

    if (!task) {
      return errorResponse(res, "Task not found", 404);
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
      userId: req.user.id,
      customerId: req.params.id,
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
      .populate("customerId", "firstName lastName email");

    if (!task) {
      return errorResponse(res, "Task not found", 404);
    }

    successResponse(res, task);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
