import express from "express";
import {
  createDeal,
  deleteDeal,
  getAllDealsByCustomerId,
  getDealById,
  getDealsByUser,
  updateDeal,
} from "../controller/DealController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
const router = express.Router();

router.use(verifyToken);
router.route("/get-deals").get(getDealsByUser);
router.route("/create-deal").post(createDeal);
router.route("/delete-deal/:id").delete(deleteDeal);
router.route("/update-deal/:id").put(updateDeal);
router.route("/get-deal/:id").get(getDealById);
router.route("/get-deals-by-customer/:id").get(getAllDealsByCustomerId);

export default router;
