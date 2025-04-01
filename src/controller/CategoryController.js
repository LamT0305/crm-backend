import CategoryModel from "../model/CategoryModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await CategoryModel.create({
      name,
      description,
      workspace: req.workspaceId,
    });

    return successResponse(res, category);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(
        res,
        "Category name already exists in this workspace"
      );
    }
    return errorResponse(res, error.message);
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.find({
      workspace: req.workspaceId,
      status: "Active",
    }).sort({ createdAt: -1 });

    return successResponse(res, categories);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};


export const deleteCategory = async (req, res) => {
  try {
    const category = await CategoryModel.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    return successResponse(res, { message: "Category deleted successfully" });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
