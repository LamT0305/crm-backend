import NotificationModel from "../model/NotificationModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1, status: 1 })
      .populate("userId", "name email");

    successResponse(res, notifications);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const markAsRead = async (req, res) => {
  try {
    console.log("id", req.params.id);
    const notification = await NotificationModel.findByIdAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        workspace: req.workspaceId,
      },
      { status: "Read" },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    successResponse(res, { message: "Notification marked as read" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};
export const markAllAsRead = async (req, res) => {
  try {
    await NotificationModel.updateMany(
      {
        userId: req.user.id,
      },
      { status: "Read" }
    );
    successResponse(res, { message: "All notifications marked as read" });
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
