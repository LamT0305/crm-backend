import express from "express";
import authMiddleWare from "../middleware/authMiddleWare.js";
import {
  createStatus,
  deleteStatus,
  getAllStatus,
} from "../controller/StatusController.js";

const router = express.Router();

router.use(authMiddleWare);

router.route("/create-status").post(createStatus);
router.route("/get-status").get(getAllStatus);
router.route("/delete-status/:id").delete(deleteStatus);

export default router;
