import SourceModel from "../model/SourceModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const createSource = async (req, res) => {
  try {
    // if (req.user.role === "Staff") {
    //   return res
    //     .status(403)
    //     .json({ message: "You don't have permission to access this page." });
    // }
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const source = await SourceModel.create({
      name: name,
    });

    successResponse(req, source);
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const deleteSource = async (req, source) => {
  try {
    const source = await SourceModel.findByIdAndDelete(req.params.id);

    if (!source) return res.status(404).send({ message: "Source not found" });
    successResponse(req, source);
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const getAllSources = async (req, res, next) => {
  try {
    const sources = await SourceModel.find();
    if (!sources) return res.status(404).send({ message: "Sources not found" });

    successResponse(req, sources);
  } catch (error) {
    errorResponse(req, error.message);
  }
};
