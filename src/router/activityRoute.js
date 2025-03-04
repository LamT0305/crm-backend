import express from "express";
import {
  createActivity,
  deleteActivity,
  getActivities,
} from "../controller/ActivityController.js";

const router = express.Router();

router.route("/get-activities").get(getActivities);
router.route("/create-activity").post(createActivity);
router.route("/delete-activity").delete(deleteActivity);

export default router;