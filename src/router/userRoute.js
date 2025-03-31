import express from "express";
import {
  getProfile,
  getUserById,
  updateUserProfile,
  viewListUsers,
} from "../controller/UserController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// User routes
router.get("/profile", getProfile);
router.get("/list", viewListUsers);
router.put("/profile", updateUserProfile);
router.get("/:id", getUserById);

export default router;