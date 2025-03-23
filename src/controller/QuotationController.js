import QuotationModel from "../model/QuotationModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// Get all quotations
export const getAllQuotations = async (req, res) => {
  try {
    const quotations = await QuotationModel.find()
      .populate("dealId")
      .populate({
        path: "products.productId",
        select: "name price description category unit",
      })
      .sort({ createdAt: -1 });

    successResponse(res, quotations);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get a single quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await QuotationModel.findById(req.params.id)
      .populate("dealId")
      .populate({
        path: "products.productId",
        select: "name price description category unit",
      });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    successResponse(res, quotation);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Update a quotation
export const updateQuotation = async (req, res) => {
  try {
    const { products, discount } = req.body;
    let updatedData = {};

    if (products && Array.isArray(products)) {
      let totalPrice = 0;
      products.forEach((item) => {
        if (!item.productId || !item.quantity || !item.price) {
          return res.status(400).json({ message: "Invalid product details" });
        }
        totalPrice += item.quantity * item.price;
      });
      updatedData.products = products;
      updatedData.totalPrice = totalPrice;
    }

    if (discount) {
      if (
        !["percentage", "fixed"].includes(discount.type) ||
        discount.value < 0
      ) {
        return res.status(400).json({
          message:
            "Invalid discount format. Type must be 'percentage' or 'fixed' and value must be non-negative",
        });
      }
      updatedData.discount = discount;
    }

    const updatedQuotation = await QuotationModel.findByIdAndUpdate(
      req.params.id,
      { ...updatedData, updatedAt: Date.now() },
      { new: true }
    )
      .populate("dealId")
      .populate({
        path: "products.productId",
        select: "name price description category unit",
      });

    if (!updatedQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    successResponse(res, updatedQuotation);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Delete a quotation
export const deleteQuotation = async (req, res) => {
  try {
    const deletedQuotation = await QuotationModel.findByIdAndDelete(
      req.params.id
    );

    if (!deletedQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    successResponse(res, { message: "Quotation deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};
