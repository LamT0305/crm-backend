import express from "express";
import {
  addTagCustomer,
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomersByUser,
  getLeadsByUser,
  removeTagCustomer,
  updateCustomer,
} from "../controller/CustomerController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Customer routes
router.post("/", createCustomer);
router.get("/customers", getCustomersByUser);
router.get("/leads", getLeadsByUser);
router.get("/:id", getCustomerById);
router.delete("/:id", deleteCustomer);
router.put("/:id", updateCustomer);

// new
router.put("/tags/:id", addTagCustomer);
router.put("/removeTag/:id", removeTagCustomer);

export default router;
