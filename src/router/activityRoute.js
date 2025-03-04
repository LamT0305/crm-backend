import express from "express";
import authMiddleWare from "../middleware/authMiddleWare.js";
import {
  createActivity,
  deleteActivity,
  getActivities,
} from "../controller/ActivityController.js";

const router = express.Router();

router.use(authMiddleWare);
router.route("/get-activiries").get(getActivities);
router.route("/create-activity").post(createActivity);
router.route("/delete-activity").delete(deleteActivity);

export default router;