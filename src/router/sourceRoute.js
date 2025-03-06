import express from "express";
import {
  createSource,
  deleteSource,
  getAllSources,
} from "../controller/SourceController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
const router = express.Router();

router.use(verifyToken);
router.route("/create-source").post(createSource);
router.route("/get-sources").get(getAllSources);
router.route("/delete-source").delete(deleteSource);

export default router;
