import SourceModel from "../model/SourceModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const createSource = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const source = await SourceModel.create({
      name: name,
    });

    return res.status(200).json({ success: true, source });
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const deleteSource = async (req, res) => {
  try {
    const source = await SourceModel.findByIdAndDelete(req.params.id);

    if (!source) return res.status(404).send({ message: "Source not found" });
    return res.status(200).json({ success: true, source });
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const getAllSources = async (req, res, next) => {
  try {
    const sources = await SourceModel.find().sort({ createdAt: -1 });
    if (!sources) return res.status(404).send({ message: "Sources not found" });

    // successResponse(req, sources);
    res.status(200).json({ sources: sources });
  } catch (error) {
    errorResponse(req, error.message);
  }
};
