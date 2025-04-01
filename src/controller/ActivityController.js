import ActivityModel from "../model/ActivityModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

const populateOptions = {
  user: { path: "userId", select: "name email" },
  customer: { path: "customerId", select: "firstName lastName email" },
};

export const createActivity = async (req, res) => {
  try {
    const { customerId, type, subject } = req.body;

    if (!customerId || !type || !subject) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const activity = await ActivityModel.create({
      userId: req.user.id,
      customerId,
      type,
      subject,
      workspace: req.workspaceId,
    });

    const populatedActivity = await ActivityModel.findById(activity._id)
      .populate(populateOptions.user)
      .populate(populateOptions.customer);

    successResponse(res, populatedActivity);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getActivities = async (req, res) => {
  try {
    const activities = await ActivityModel.find({
      workspace: req.workspaceId,
      customerId: req.params.customerId,
    })
      .populate(populateOptions.user)
      .populate(populateOptions.customer)
      .sort({ createdAt: -1 });

    if (!activities) {
      return res.status(404).json({ message: "Activities not found" });
    }
    successResponse(res, activities);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const activity = await ActivityModel.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    successResponse(res, { message: "Activity deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};
