import express from "express";
import {
  createCustomerCare,
  getCustomerCareByCustomer,
  getCustomerCareById,
  updateCustomerCare,
  deleteCustomerCare,
} from "../controller/CustomerCareController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Customer Care routes
router.post("/", createCustomerCare);
router.get("/customer/:id", getCustomerCareByCustomer);
router.get("/:id", getCustomerCareById);
router.put("/:id", updateCustomerCare);
router.delete("/:id", deleteCustomerCare);

export default router;
