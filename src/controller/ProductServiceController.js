import ProductServiceModel from "../model/ProductModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// Create a new product/service
export const createProductService = async (req, res) => {
  try {
    const { name, description, price, category, status } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const productService = await ProductServiceModel.create({
      name,
      description,
      price,
      category,
      status,
    });

    successResponse(res, productService);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get all products/services
export const getAllProductServices = async (req, res) => {
  try {
    const productServices = await ProductServiceModel.find().sort({
      createdAt: -1,
    });
    successResponse(res, productServices);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get a single product/service by ID
export const getProductServiceById = async (req, res) => {
  try {
    const productService = await ProductServiceModel.findById(req.params.id);

    if (!productService) {
      return res.status(404).json({ message: "Product/Service not found" });
    }

    successResponse(res, productService);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Update a product/service
export const updateProductService = async (req, res) => {
  try {
    const { name, description, price, category, status } = req.body;

    const updatedProductService = await ProductServiceModel.findByIdAndUpdate(
      req.params.id,
      { name, description, price, category, status, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedProductService) {
      return res.status(404).json({ message: "Product/Service not found" });
    }

    successResponse(res, updatedProductService);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Delete a product/service
export const deleteProductService = async (req, res) => {
  try {
    const deletedProductService = await ProductServiceModel.findByIdAndDelete(
      req.params.id
    );

    if (!deletedProductService) {
      return res.status(404).json({ message: "Product/Service not found" });
    }

    successResponse(res, { message: "Product/Service deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};
