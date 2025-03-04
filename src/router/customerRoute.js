import express from "express";
import authMiddleWare from "../middleware/authMiddleWare.js";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomersByUser,
  updateCustomer,
  updateCustomerCompany,
} from "../controller/CustomerController.js";
const router = express.Router();

router.use(authMiddleWare);
router.route("/create-customer").post(createCustomer);
router.route("/customers").get(getCustomersByUser);
router.route("/get-customers/:id").get(getCustomerById);
router.route("/delete-customer/:id").delete(deleteCustomer);
router.route("/update-customer-company/:id").put(updateCustomerCompany);
router.route("update-customer/:id").put(updateCustomer);

export default router;