import express from "express";
import {
  createProductService,
  getAllProductServices,
  getProductServiceById,
  updateProductService,
  deleteProductService,
} from "../controller/ProductServiceController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";

const router = express.Router();

router.use(verifyToken);

router.route("/create-product").post(createProductService);
router.route("/products").get(getAllProductServices);
router.route("/get-product/:id").get(getProductServiceById);
router.route("/update-product/:id").put(updateProductService);
router.route("/delete-product/:id").delete(deleteProductService);

export default router;
