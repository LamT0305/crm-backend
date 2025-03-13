import express from "express";
import {
  createCustomerCare,
  getCustomerCareByCustomer,
  getCustomerCareById,
  updateCustomerCare,
  deleteCustomerCare,
} from "../controller/CustomerCareController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";

const router = express.Router();

router.use(verifyToken);

router.route("/create-customer-care").post(createCustomerCare);
router.route("/customer-care/:id").get(getCustomerCareByCustomer);
router.route("/get-customer-care/:id").get(getCustomerCareById);
router.route("/update-customer-care/:id").put(updateCustomerCare);
router.route("/delete-customer-care/:id").delete(deleteCustomerCare);

export default router;
