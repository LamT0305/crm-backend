import express from "express";
import {
  createNotification,
  getNotifications,
  deleteNotification,
  markNotificationAsRead,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
} from "../controller/NotificationController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// All routes are protected with authentication
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Notification routes
router.get("/", getNotifications);
router.delete("/:id", deleteNotification);
router.put("/:id/read", markNotificationAsRead);
router.get("/unread/count", getUnreadNotificationsCount);
router.put("/mark-all-read", markAllNotificationsAsRead);

export default router;
