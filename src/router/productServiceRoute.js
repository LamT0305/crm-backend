import express from "express";
import {
  createProductService,
  getAllProductServices,
  getProductServiceById,
  updateProductService,
  deleteProductService,
} from "../controller/ProductServiceController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Product routes
router.post("/", createProductService);
router.get("/", getAllProductServices);
router.get("/:id", getProductServiceById);
router.put("/:id", updateProductService);
router.delete("/:id", deleteProductService);

export default router;
