import express from "express";
import {
  createDeal,
  deleteDeal,
  getAllDealsByCustomerId,
  getDealById,
  getDealsByUser,
  updateDeal,
} from "../controller/DealController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Deal routes
router.get("/", getDealsByUser);
router.post("/", createDeal);
router.delete("/:id", deleteDeal);
router.put("/:id", updateDeal);
router.get("/:id", getDealById);
router.get("/customer/:id", getAllDealsByCustomerId);

export default router;
