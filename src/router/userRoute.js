import express from "express";
import {
  getUserById,
  updateUserProfile,
  viewListUsers,
  viewListUsersInWorkspace,
} from "../controller/UserController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// User routes
router.get("/list", viewListUsers);
router.get("/list/workspace", viewListUsersInWorkspace);
router.put("/profile", updateUserProfile);
router.get("/:id", getUserById);

export default router;
