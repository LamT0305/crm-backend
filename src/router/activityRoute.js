import express from "express";
import {
  createActivity,
  deleteActivity,
  getActivities,
} from "../controller/ActivityController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Activity routes
router.get("/:customerId", getActivities);
router.post("/", createActivity);
router.delete("/:id", deleteActivity);

export default router;
