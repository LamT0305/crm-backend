import QuotationModel from "../model/QuotationModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import mongoose from "mongoose";

const calculatePrices = (products, discount) => {
  const totalPrice = products.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  let finalPrice = totalPrice;
  if (discount) {
    if (discount.type === "percentage") {
      finalPrice = totalPrice * (1 - discount.value / 100);
    } else {
      finalPrice = totalPrice - discount.value;
    }
  }
  return { totalPrice, finalPrice };
};

export const getAllQuotations = async (req, res) => {
  try {
    const quotations = await QuotationModel.find({
      workspace: req.workspaceId,
    })
      .populate({
        path: "dealId",
        select: "status customerId",
        populate: {
          path: "customerId",
          select: "firstName lastName email",
        },
      })
      .populate({
        path: "products.productId",
        select: "name price description category unit",
        populate: {
          path: "category",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    successResponse(res, quotations);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getQuotationById = async (req, res) => {
  try {
    const quotation = await QuotationModel.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    })
      .populate({
        path: "dealId",
        select: "status customerId",
        populate: {
          path: "customerId",
          select: "firstName lastName email",
        },
      })
      .populate({
        path: "products.productId",
        select: "name price description category unit",
        populate: {
          path: "category",
          select: "name",
        },
      });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    successResponse(res, quotation);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const updateQuotation = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid quotation ID format" });
    }

    const { products, discount, status } = req.body;
    let updatedData = {};

    if (products && Array.isArray(products)) {
      for (const item of products) {
        if (!item.productId || !item.quantity || !item.price) {
          return res.status(400).json({ message: "Invalid product details" });
        }
      }
      const { totalPrice, finalPrice } = calculatePrices(
        products,
        discount || undefined
      );
      updatedData = {
        ...updatedData,
        products,
        totalPrice,
        finalPrice,
      };
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
      if (!products) {
        const { totalPrice, finalPrice } = calculatePrices(
          updatedData.products,
          discount
        );
        updatedData.totalPrice = totalPrice;
        updatedData.finalPrice = finalPrice;
      }
    }

    if (status) {
      updatedData.status = status;
    }

    const updatedQuotation = await QuotationModel.findOneAndUpdate(
      {
        _id: req.params.id,
        workspace: req.workspaceId,
      },
      {
        ...updatedData,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate({
        path: "dealId",
        select: "status customerId",
        populate: {
          path: "customerId",
          select: "firstName lastName email",
        },
      })
      .populate({
        path: "products.productId",
        select: "name price description category unit",
        populate: {
          path: "category",
          select: "name",
        },
      });

    if (!updatedQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    successResponse(res, updatedQuotation);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteQuotation = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid quotation ID format" });
    }

    const deletedQuotation = await QuotationModel.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!deletedQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    successResponse(res, { message: "Quotation deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};
