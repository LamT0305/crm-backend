import express from "express";
import {
  createSource,
  deleteSource,
  getAllSources,
} from "../controller/SourceController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";
const router = express.Router();

router.use(verifyToken, checkWorkspaceAccess);
router.route("/create-source").post(createSource);
router.route("/get-sources").get(getAllSources);
router.route("/delete-source/:id").delete(deleteSource);

export default router;
