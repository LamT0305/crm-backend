import DealModel from "../model/DealModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

// Create a new deal
export const createDeal = async (req, res) => {
  try {
    const { customerId, products, quotationId, status } = req.body;

    // Validate required fields
    if (!customerId || !status) {
      return res
        .status(400)
        .json({ message: "Customer ID and status are required" });
    }

    const deal = await DealModel.create({
      userId: req.user.id,
      customerId,
      products, // Array of { productId, quantity, price }
      quotationId,
      status,
    });

    successResponse(res, deal);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get all deals for the logged-in user
export const getDealsByUser = async (req, res) => {
  try {
    const deals = await DealModel.find({ userId: req.user.id })
      .populate("customerId", "name email phone") // Include customer details
      .populate("products.productId", "name price") // Include product details
      .populate("quotationId") // Include linked quotation
      .sort({ createdAt: -1 });

    successResponse(res, deals);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get a single deal by ID
export const getDealById = async (req, res) => {
  try {
    const deal = await DealModel.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("products.productId", "name price")
      .populate("quotationId");

    if (!deal) return res.status(404).json({ message: "Deal not found" });

    successResponse(res, deal);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Update deal details
export const updateDeal = async (req, res) => {
  try {
    const { customerId, products, quotationId, status } = req.body;

    const updatedDeal = await DealModel.findByIdAndUpdate(
      req.params.id,
      { customerId, products, quotationId, status },
      { new: true }
    );

    if (!updatedDeal)
      return res.status(404).json({ message: "Deal not found" });

    successResponse(res, updatedDeal);
  } catch (error) {
    errorResponse(res, error.message);
  }
};



// Delete deal
export const deleteDeal = async (req, res) => {
  try {
    const deletedDeal = await DealModel.findByIdAndDelete(req.params.id);

    if (!deletedDeal)
      return res.status(404).json({ message: "Deal not found" });

    successResponse(res, { message: "Deal deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};
