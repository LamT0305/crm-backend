import express from "express";
import {
  getCustomerStatusDistribution,
  getCustomerIndustryDistribution,
  getCustomerSourceDistribution,
  getMonthlyIncomeDistribution,
  getDealStatusDistribution,
  getDealValueAnalysis,
  getProductPerformance,
  getInteractionTypeDistribution,
  getInteractionTimeline,
  getQuotationAnalysis,
  getDiscountAnalysis,
} from "../controller/AnalyticsController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";

const router = express.Router();

// Customer Analytics Routes
router.get("/customer/status", verifyToken, getCustomerStatusDistribution);
router.get("/customer/industry", verifyToken, getCustomerIndustryDistribution);
router.get("/customer/source", verifyToken, getCustomerSourceDistribution);
router.get("/customer/income", verifyToken, getMonthlyIncomeDistribution);

// Deal Analytics Routes
router.get("/deal/status", verifyToken, getDealStatusDistribution);
router.get("/deal/value", verifyToken, getDealValueAnalysis);
router.get("/deal/products", verifyToken, getProductPerformance);

// Customer Interaction Analytics Routes
router.get("/interaction/type", verifyToken, getInteractionTypeDistribution);
router.get("/interaction/timeline", verifyToken, getInteractionTimeline);

// Sales Performance Analytics Routes
router.get("/sales/quotations", verifyToken, getQuotationAnalysis);
router.get("/sales/discounts", verifyToken, getDiscountAnalysis);
export default router;
