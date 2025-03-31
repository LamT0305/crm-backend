import express from "express";
import {
  createTask,
  deleteTask,
  getAllTasksByUser,
  getTaskById,
  getTasksBetweenUserAndCustomer,
  updateTask,
} from "../controller/TaskController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Task routes
router.get("/", getAllTasksByUser);
router.post("/", createTask);
router.get("/customer/:id", getTasksBetweenUserAndCustomer);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
