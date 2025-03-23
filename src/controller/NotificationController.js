import NotificationModel from "../model/NotificationModel.js";

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        status: "error",
        message: "Message is required",
      });
    }
    const notification = await NotificationModel.create({
      userId: req.user.id,
      message: message,
      status: "Unread",
    });
    res.status(200).json({
      status: "success",
      data: notification,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate("userId", "name email");

    res.status(200).json({
      status: "success",
      data: notifications,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Create email notification
export const createEmailNotification = async (req, res) => {
  try {
    const { emailData } = req.body;
    const userId = req.user.id;

    const notification = await NotificationModel.create({
      userId,
      message: `New email from ${emailData.from}: ${emailData.subject}`,
      status: "Unread",
    });

    req.io.emit("notification", {
      type: "email",
      data: notification,
    });

    res.status(200).json({
      status: "success",
      data: notification,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found",
      });
    }
    if (notification.userId.toString() !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to delete this notification",
      });
    }
    await notification.deleteOne();
    res.status(200).json({
      status: "success",
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const notification = await NotificationModel.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found",
      });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to update this notification",
      });
    }

    notification.status = "Read";
    await notification.save();

    res.status(200).json({
      status: "success",
      data: notification,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const count = await NotificationModel.countDocuments({
      userId: req.user.id,
      status: "Unread",
    });

    res.status(200).json({
      status: "success",
      data: { count },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await NotificationModel.updateMany(
      { userId: userId, status: "Unread" },
      { status: "Read" }
    );

    res.status(200).json({
      status: "success",
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
