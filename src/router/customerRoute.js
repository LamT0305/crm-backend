import express from "express";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomersByUser,
  getLeadsByUser,
  updateCustomer,
} from "../controller/CustomerController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
const router = express.Router();

router.use(verifyToken);
router.route("/create-customer").post(createCustomer);
router.route("/customers").get(getCustomersByUser);
router.route("/get-all-leads").get(getLeadsByUser);
router.route("/get-customer/:id").get(getCustomerById);
router.route("/delete-customer/:id").delete(deleteCustomer);
router.route("/update-customer/:id").put(updateCustomer);


export default router;
