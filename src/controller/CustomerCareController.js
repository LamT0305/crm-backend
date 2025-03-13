import CustomerCareModel from "../model/CustomerCareModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// Create a new customer care interaction
export const createCustomerCare = async (req, res) => {
  try {
    const { customerId, type, notes } = req.body;

    if (!customerId || !type || !notes) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const customerCare = await CustomerCareModel.create({
      customerId,
      userId: req.user.id,
      type,
      notes,
    });

    successResponse(res, customerCare);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get all interactions for a customer
export const getCustomerCareByCustomer = async (req, res) => {
  try {
    const interactions = await CustomerCareModel.find({
      customerId: req.params.id,
    })
      .populate("customerId")
      .populate("userId")
      .sort({ date: -1 });

    successResponse(res, interactions);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get a specific interaction by ID
export const getCustomerCareById = async (req, res) => {
  try {
    const interaction = await CustomerCareModel.findById(req.params.id)
      .populate("customerId")
      .populate("userId");

    if (!interaction) {
      return res.status(404).json({ message: "Interaction not found" });
    }

    successResponse(res, interaction);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Update a customer care interaction
export const updateCustomerCare = async (req, res) => {
  try {
    const { type, notes } = req.body;
    const updatedInteraction = await CustomerCareModel.findByIdAndUpdate(
      req.params.id,
      { type, notes, updatedAt: Date.now() },
      { new: true }
    )
      .populate("customerId")
      .populate("userId");

    if (!updatedInteraction) {
      return res.status(404).json({ message: "Interaction not found" });
    }

    successResponse(res, updatedInteraction);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Delete a customer care interaction
export const deleteCustomerCare = async (req, res) => {
  try {
    const deletedInteraction = await CustomerCareModel.findByIdAndDelete(
      req.params.id
    );

    if (!deletedInteraction) {
      return res.status(404).json({ message: "Interaction not found" });
    }

    successResponse(res, { message: "Interaction deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};
