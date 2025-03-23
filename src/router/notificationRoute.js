import express from "express";
import {
  createNotification,
  getNotifications,
  createEmailNotification,
  deleteNotification,
  markNotificationAsRead,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
} from "../controller/NotificationController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";

const router = express.Router();

// All routes are protected with authentication
router.use(verifyToken);

// Notification routes
router.post("/", createNotification);
router.get("/", getNotifications);
router.post("/email", createEmailNotification);
router.delete("/:id", deleteNotification);
router.put("/:id/read", markNotificationAsRead);
router.get("/unread/count", getUnreadNotificationsCount);
router.put("/mark-all-read", markAllNotificationsAsRead);

export default router;
