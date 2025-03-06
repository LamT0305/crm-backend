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

router.route("/create-product-service").post(createProductService);
router.route("/product-services").get(getAllProductServices);
router.route("/get-product-service/:id").get(getProductServiceById);
router.route("/update-product-service/:id").put(updateProductService);
router.route("/delete-product-service/:id").delete(deleteProductService);

export default router;
