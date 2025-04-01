import express from "express";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";
import {
  createCategory,
  getAllCategories,
  deleteCategory,
} from "../controller/CategoryController.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Category routes
router.post("/", createCategory);
router.get("/", getAllCategories);
router.delete("/:id", deleteCategory);

export default router;
