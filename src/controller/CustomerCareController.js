import CustomerCareModel from "../model/CustomerCareModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// Common population options
const populateOptions = {
  customerId: {
    path: "customerId",
    select: "firstName lastName email phone gender",
  },
  userId: { path: "userId", select: "name email" },
};

// Validate interaction type
const validateType = (type) => {
  const validTypes = [
    "Call",
    "Email",
    "Meeting",
    "Follow-up-Sale", // Following up after a sale
    "Follow-up-Issue", // Following up after resolving an issue
    "Follow-up-Meeting", // Following up after a meeting
    "Follow-up-Quote", // Following up on a quotation
  ];
  return validTypes.includes(type);
};

export const createCustomerCare = async (req, res) => {
  try {
    const { customerId, type, notes } = req.body;

    if (!customerId || !type || !notes?.trim()) {
      return res.status(400).json({
        message: "Customer ID, type, and notes are required",
        body: req.body,
      });
    }

    if (!validateType(type)) {
      return res.status(400).json({
        message:
          "Invalid interaction type. Must be Call, Email, Meeting, or Follow-up",
      });
    }

    const customerCare = await CustomerCareModel.create({
      customerId,
      userId: req.user.id,
      type,
      notes: notes.trim(),
    }).then((doc) =>
      doc.populate([populateOptions.customerId, populateOptions.userId])
    );

    successResponse(res, customerCare);
  } catch (error) {
    console.error("Create CustomerCare Error:", error);
    errorResponse(res, error.message);
  }
};

export const getCustomerCareByCustomer = async (req, res) => {
  try {
    const interactions = await CustomerCareModel.find({
      customerId: req.params.id,
    })
      .populate([populateOptions.customerId, populateOptions.userId])
      .sort({ createdAt: -1 })
      .lean();

    if (!interactions) {
      return res.status(404).json({
        message: "No interactions found for this customer",
      });
    }

    successResponse(res, {
      interactions,
      total: interactions.length,
    });
  } catch (error) {
    console.error("Get CustomerCare Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid customer ID format" });
    }
    errorResponse(res, error.message);
  }
};

export const getCustomerCareById = async (req, res) => {
  try {
    const interaction = await CustomerCareModel.findById(
      req.params.id
    ).populate([populateOptions.customerId, populateOptions.userId]);

    if (!interaction) {
      return res.status(404).json({ message: "Interaction not found" });
    }

    if (interaction.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized to view this interaction",
      });
    }

    successResponse(res, interaction);
  } catch (error) {
    console.error("Get CustomerCare By ID Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid interaction ID format" });
    }
    errorResponse(res, error.message);
  }
};

export const updateCustomerCare = async (req, res) => {
  try {
    const { type, notes } = req.body;

    if (type && !validateType(type)) {
      return res.status(400).json({
        message:
          "Invalid interaction type. Must be Call, Email, Meeting, or Follow-up",
      });
    }

    const interaction = await CustomerCareModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        $set: {
          ...(type && { type }),
          ...(notes?.trim() && { notes: notes.trim() }),
          updatedAt: Date.now(),
        },
      },
      { new: true }
    ).populate([populateOptions.customerId, populateOptions.userId]);

    if (!interaction) {
      return res.status(404).json({
        message: "Interaction not found or not authorized to update",
      });
    }

    successResponse(res, interaction);
  } catch (error) {
    console.error("Update CustomerCare Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid interaction ID format" });
    }
    errorResponse(res, error.message);
  }
};

export const deleteCustomerCare = async (req, res) => {
  try {
    const result = await CustomerCareModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!result) {
      return res.status(404).json({
        message: "Interaction not found or not authorized to delete",
      });
    }

    successResponse(res, { message: "Interaction deleted successfully" });
  } catch (error) {
    console.error("Delete CustomerCare Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid interaction ID format" });
    }
    errorResponse(res, error.message);
  }
};
