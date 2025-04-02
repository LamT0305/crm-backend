import NotificationModel from "../model/NotificationModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";



export const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    successResponse(res, notifications);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await NotificationModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    successResponse(res, { message: "Notification deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};



