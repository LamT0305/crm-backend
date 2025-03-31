import express from "express";

import {
  createWorkspace,
  inviteMember,
  joinWorkspace,
  getWorkspaceDetails,
} from "../controller/WorkspaceController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";

const router = express.Router();

// Create a new workspace
router.post("/create", verifyToken, createWorkspace);

// Invite a member to workspace
router.post("/invite", verifyToken, inviteMember);

// Join a workspace with invitation token
router.post("/join/:token", verifyToken, joinWorkspace);

// Get workspace details
router.get("/details", verifyToken, getWorkspaceDetails);

export default router;
