import StatusModel from "../model/StatusModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const createStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not allowed access this page" });
    }

    const { name, type, color } = req.body;
    if (!name || !type || !color)
      return res.status(400).json({ message: "All fields are required" });
    const status = await StatusModel.create({
      name: name,
      type: type,
      color: color,
    });
    successResponse(req, status);
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const deleteStatus = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not allowed access this page" });
    }
    const status = await StatusModel.findByIdAndDelete(req.params.id);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }
    successResponse(req, status);
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const getAllStatus = async (req, res) => {
  try {
    const status = await StatusModel.find();
    successResponse(req, status);
  } catch (error) {
    errorResponse(req, error.message);
  }
};
