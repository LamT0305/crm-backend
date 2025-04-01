import mongoose from "mongoose";
import ProductServiceModel from "../model/ProductModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

const validateProductData = (data) => {
  const { name, price, category, unit } = data;

  if (!name?.trim() || !price || !category || !unit) {
    return "Name, price, category, and unit are required";
  }

  return null;
};

const populateOptions = {
  category: { path: "category", select: "name description" },
};

export const createProductService = async (req, res) => {
  try {
    const validationError = validateProductData(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { name, description, price, category, status, stock, unit } =
      req.body;

    const existingProduct = await ProductServiceModel.findOne({
      name: name.trim(),
      workspace: req.workspaceId,
    }).lean();

    if (existingProduct) {
      return res.status(409).json({
        message: "Product/Service already exists in this workspace",
      });
    }

    const productService = await ProductServiceModel.create({
      name: name.trim(),
      description: description?.trim(),
      price,
      category,
      status,
      unit,
      stock: stock || 0,
      workspace: req.workspaceId,
    });

    const populatedProduct = await ProductServiceModel.findById(
      productService._id
    ).populate(populateOptions.category);
    successResponse(res, populatedProduct);
  } catch (error) {
    console.error("Create Product Error:", error);
    errorResponse(res, error.message);
  }
};

export const getAllProductServices = async (req, res) => {
  try {
    const products = await ProductServiceModel.find({
      workspace: req.workspaceId,
    })
      .populate(populateOptions.category)
      .sort({ createdAt: -1 })
      .select("-__v")
      .lean();

    successResponse(res, {
      products,
      total: products.length,
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    errorResponse(res, error.message);
  }
};

export const getProductServiceById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const productService = await ProductServiceModel.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    })
      .populate(populateOptions.category)
      .lean();

    if (!productService) {
      return res.status(404).json({ message: "Product/Service not found" });
    }

    successResponse(res, productService);
  } catch (error) {
    console.error("Get Product Error:", error);
    errorResponse(res, error.message);
  }
};

export const updateProductService = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const validationError = validateProductData(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { name, description, price, category, status, stock, unit } =
      req.body;

    // Check if new name conflicts with existing product in the same workspace
    if (name) {
      const existingProduct = await ProductServiceModel.findOne({
        _id: { $ne: req.params.id },
        name: name.trim(),
        workspace: req.workspaceId,
      }).lean();

      if (existingProduct) {
        return res.status(409).json({
          message:
            "Another product/service already exists with this name in this workspace",
        });
      }
    }

    const updatedProductService = await ProductServiceModel.findOneAndUpdate(
      {
        _id: req.params.id,
        workspace: req.workspaceId,
      },
      {
        name: name.trim(),
        description: description?.trim(),
        price,
        category,
        status,
        unit,
        stock: stock || 0,
      },
      { new: true }
    ).populate(populateOptions.category);

    if (!updatedProductService) {
      return res.status(404).json({ message: "Product/Service not found" });
    }

    successResponse(res, updatedProductService);
  } catch (error) {
    console.error("Update Product Error:", error);
    errorResponse(res, error.message);
  }
};

export const deleteProductService = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const deletedProductService = await ProductServiceModel.findOneAndUpdate(
      {
        _id: req.params.id,
        workspace: req.workspaceId,
      },
      { status: "Inactive" },
      { new: true }
    );

    if (!deletedProductService) {
      return res.status(404).json({ message: "Product/Service not found" });
    }

    successResponse(res, {
      message: "Product/Service deleted successfully",
      deletedId: req.params.id,
    });
  } catch (error) {
    console.error("Delete Product Error:", error);
    errorResponse(res, error.message);
  }
};
