import express from "express";
import { verifyToken } from "../middleware/authMiddleWare.js";
import {
  createWorkspace,
  inviteMember,
  joinWorkspace,
  getWorkspaceDetails,
  switchWorkspace,
  userWorkspaces,
} from "../controller/WorkspaceController.js";

const router = express.Router();

router.use(verifyToken);

router.post("/create", createWorkspace);
router.post("/invite", inviteMember);
router.get("/join/:token", joinWorkspace);
router.get("/details", getWorkspaceDetails);
router.post("/switch", switchWorkspace);
router.get("/user-workspaces", userWorkspaces);

export default router;
