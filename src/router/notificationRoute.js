import express from "express";
import {
  getNotifications,
  deleteNotification,
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

export default router;
