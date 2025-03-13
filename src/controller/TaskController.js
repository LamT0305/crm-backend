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

    successResponse(req, task);
  } catch (error) {
    errorResponse(req, error.message);
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

    const task = await TaskModel.findByIdAndUpdate(req.params.id, {
      title: title,
      customerId: customerId,
      description: description,
      dueDate: dueDate,
      priority: priority,
      status: status,
    });

    if (!task) return res.status(404).json({ message: "Task not found" });
    successResponse(req, task);
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const getAllTasksByUser = async (req, res, next) => {
  try {
    const tasks = await TaskModel.find({ userId: req.user.id });
    if (!tasks) return res.status(400).json({ message: "Task not found" });

    successResponse(req, tasks);
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const getTasksBetweenUserAndCustomer = async (req, res) => {
  try {
    const tasks = await TaskModel.find({
      userId: req.user.id,
      customerId: req.body,
    });

    if (!tasks) {
      return res.status(404).json({ message: "Task not found" });
    }

    successResponse(req, tasks);
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await TaskModel.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    successResponse(req, task);
  } catch (error) {
    errorResponse(req, error.message);
  }
};
