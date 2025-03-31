import SourceModel from "../model/SourceModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const createSource = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return errorResponse(res, "Name is required", 400);
    }

    const existingSource = await SourceModel.findOne({
      name: name.trim(),
      workspace: req.workspaceId,
    });

    if (existingSource) {
      return errorResponse(res, "Source with this name already exists", 409);
    }

    const source = await SourceModel.create({
      name: name.trim(),
      workspace: req.workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    successResponse(res, source);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getAllSources = async (req, res) => {
  try {
    const sources = await SourceModel.find({
      workspace: req.workspaceId,
    }).sort({ createdAt: -1 });

    successResponse(res, { sources, total: sources.length });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteSource = async (req, res) => {
  try {
    const source = await SourceModel.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!source) {
      return errorResponse(res, "Source not found", 404);
    }

    successResponse(res, { message: "Source deleted successfully", source });
  } catch (error) {
    errorResponse(res, error.message);
  }
};
