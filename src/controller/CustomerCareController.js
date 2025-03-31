import CustomerCareModel from "../model/CustomerCareModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

const populateOptions = {
  customer: {
    path: "customerId",
    select: "firstName lastName email phone gender",
  },
  user: { path: "userId", select: "name email" },
};

const validateType = (type) => {
  const validTypes = [
    "Call",
    "Email",
    "Meeting",
    "Follow-up-Sale",
    "Follow-up-Issue",
    "Follow-up-Meeting",
    "Follow-up-Quote",
  ];
  return validTypes.includes(type);
};

export const createCustomerCare = async (req, res) => {
  try {
    const { customerId, type, notes } = req.body;

    if (!customerId || !type || !notes?.trim()) {
      return res.status(400).json({
        message: "Customer ID, type, and notes are required",
      });
    }

    if (!validateType(type)) {
      return res.status(400).json({
        message: "Invalid interaction type",
      });
    }

    const customerCare = await CustomerCareModel.create({
      customerId,
      userId: req.user.id,
      type,
      notes: notes.trim(),
      workspace: req.workspaceId,
      date: new Date(),
    });

    const populatedCare = await customerCare
      .populate(populateOptions.customer)
      .populate(populateOptions.user);

    successResponse(res, populatedCare);
  } catch (error) {
    console.error("Create CustomerCare Error:", error);
    errorResponse(res, error.message);
  }
};

export const getCustomerCareByCustomer = async (req, res) => {
  try {
    const interactions = await CustomerCareModel.find({
      customerId: req.params.id,
      workspace: req.workspaceId,
    })
      .populate([populateOptions.customer, populateOptions.user])
      .sort({ createdAt: -1 })
      .lean();

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
    const interaction = await CustomerCareModel.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    }).populate([populateOptions.customer, populateOptions.user]);

    if (!interaction) {
      return res.status(404).json({ message: "Interaction not found" });
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
        message: "Invalid interaction type",
      });
    }

    const interaction = await CustomerCareModel.findOneAndUpdate(
      {
        _id: req.params.id,
        workspace: req.workspaceId,
        userId: req.user.id,
      },
      {
        $set: {
          ...(type && { type }),
          ...(notes?.trim() && { notes: notes.trim() }),
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).populate([populateOptions.customer, populateOptions.user]);

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
      workspace: req.workspaceId,
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
