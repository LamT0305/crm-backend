import express from "express";
import {
  createQuotation,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  getAllQuotations,
} from "../controller/QuotationController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";

const router = express.Router();

router.use(verifyToken);

router.route("/create-quotation").post(createQuotation);
router.route("/quotations").get(getAllQuotations);
router.route("/get-quotation/:id").get(getQuotationById);
router.route("/update-quotation/:id").put(updateQuotation);
router.route("/delete-quotation/:id").delete(deleteQuotation);

export default router;
