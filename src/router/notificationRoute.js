import express from "express";
import {
  getNotifications,
  deleteNotification,
  markAsRead,
  markAllAsRead,
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
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

export default router;
