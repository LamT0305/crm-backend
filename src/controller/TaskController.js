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
    )
      return res.status(400).json({ message: "All fields are required" });

    const task = await TaskModel.create({
      userId: req.user.id,
      customerId: customerId,
      title: title,
      description: description,
      dueDate: dueDate,
      priority: priority,
      status: status,
    });

    successResponse(res, task);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const updateTask = async (req, res, next) => {
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
    )
      return res.status(400).json({ message: "All fields are required" });

    const task = await TaskModel.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    task.title = title;
    task.description = description;
    task.dueDate = dueDate;
    task.priority = priority;
    task.status = status;

    await task.save();
    successResponse(res, task);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getAllTasksByUser = async (req, res, next) => {
  try {
    const tasks = await TaskModel.find({ userId: req.user.id })
      .populate("userId", "name")
      .populate("customerId");
    if (!tasks) return res.status(400).json({ message: "Task not found" });

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
    })
      .populate("userId", "name")
      .populate("customerId")
      .sort({ createdAt: -1 });

    successResponse(res, tasks);
  } catch (error) {
    errorResponse(res, error);
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await TaskModel.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    successResponse(res, task);
  } catch (error) {
    errorResponse(res, error);
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Taks not found!" });
    successResponse(res, task);
  } catch (error) {
    return errorResponse(res, error);
  }
};
