import express from "express";
import {
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  getAllQuotations,
} from "../controller/QuotationController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Quotation routes
router.get("/", getAllQuotations);
router.get("/:id", getQuotationById);
router.put("/:id", updateQuotation);
router.delete("/:id", deleteQuotation);

export default router;
