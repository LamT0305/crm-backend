import express from "express";
import authMiddleWare from "../middleware/authMiddleWare.js";
import {
  createSource,
  deleteSource,
  getAllSources,
} from "../controller/SourceController.js";

const router = express.Router();

router.use(authMiddleWare);

router.route("/create-source").post(createSource);
router.route("/get-sources").get(getAllSources);
router.route("/delete-source").delete(deleteSource);

export default router;
