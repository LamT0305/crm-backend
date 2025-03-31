import NotificationModel from "../model/NotificationModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!message) {
      return errorResponse(res, "Message is required", 400);
    }

    const notification = await NotificationModel.create({
      userId: req.user.id,
      title: title || "Notification",
      message,
      status: "Unread",
      workspace: req.workspaceId,
      createdAt: new Date(),
    });

    await notification.populate("userId", "name email");
    successResponse(res, notification);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      userId: req.user.id,
      workspace: req.workspaceId,
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
      workspace: req.workspaceId,
    });

    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    successResponse(res, { message: "Notification deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        workspace: req.workspaceId,
      },
      { status: "Read" },
      { new: true }
    ).populate("userId", "name email");

    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    successResponse(res, notification);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const count = await NotificationModel.countDocuments({
      userId: req.user.id,
      workspace: req.workspaceId,
      status: "Unread",
    });

    successResponse(res, { count });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await NotificationModel.updateMany(
      {
        userId: req.user.id,
        workspace: req.workspaceId,
        status: "Unread",
      },
      { status: "Read" }
    );

    successResponse(res, {
      message: "All notifications marked as read",
      updated: result.modifiedCount,
    });
  } catch (error) {
    errorResponse(res, error.message);
  }
};
