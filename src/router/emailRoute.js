import express from "express";
import {
  getEmails,
  handleDeleteEmail,
  sendEmail,
} from "../controller/EmailController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Email routes
router.post("/", sendEmail);
router.get("/:id", getEmails);
router.delete("/:id", handleDeleteEmail);

export default router;
