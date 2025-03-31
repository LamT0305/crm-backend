import express from "express";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";
import {
  createComment,
  deleteComment,
  getCommentsByCustomer,
} from "../controller/CommentController.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Comment routes
router.get("/:customerId", getCommentsByCustomer);
router.post("/", createComment);
router.delete("/:id", deleteComment);

export default router;
