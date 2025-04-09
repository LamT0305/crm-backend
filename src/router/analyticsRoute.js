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
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Customer Analytics Routes
router.get(
  "/customer/status",
  verifyToken,
  checkWorkspaceAccess,
  getCustomerStatusDistribution
);
router.get(
  "/customer/industry",
  verifyToken,
  checkWorkspaceAccess,
  getCustomerIndustryDistribution
);
router.get(
  "/customer/source",
  verifyToken,
  checkWorkspaceAccess,
  getCustomerSourceDistribution
);
router.get(
  "/customer/income",
  verifyToken,
  checkWorkspaceAccess,
  getMonthlyIncomeDistribution
);

// Deal Analytics Routes
router.get(
  "/deal/status",
  verifyToken,
  checkWorkspaceAccess,
  getDealStatusDistribution
);
router.get(
  "/deal/value",
  verifyToken,
  checkWorkspaceAccess,
  getDealValueAnalysis
);
router.get(
  "/deal/products",
  verifyToken,
  checkWorkspaceAccess,
  getProductPerformance
);

// Customer Interaction Analytics Routes
router.get(
  "/interaction/type",
  verifyToken,
  checkWorkspaceAccess,
  getInteractionTypeDistribution
);
router.get(
  "/interaction/timeline",
  verifyToken,
  checkWorkspaceAccess,
  getInteractionTimeline
);

// Sales Performance Analytics Routes
router.get(
  "/sales/quotations",
  verifyToken,
  checkWorkspaceAccess,
  getQuotationAnalysis
);
router.get(
  "/sales/discounts",
  verifyToken,
  checkWorkspaceAccess,
  getDiscountAnalysis
);

export default router;
