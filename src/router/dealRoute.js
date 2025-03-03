import express from "express";
import {
  createDeal,
  deleteDeal,
  getDealByUser,
  updateDealStatus,
} from "../controller/DealController.js";

const router = express.Router();


router.route("/get-deals").get(getDealByUser);
router.route("/create-deal").post(createDeal);
router.route("/delete-deal/:id").delete(deleteDeal);
router.route("/update-deal-status/:id").put(updateDealStatus);

export default router;
