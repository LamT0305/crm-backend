import mongoose from "mongoose";
import CustomerModel from "../model/CustomerModel.js";
import DealModel from "../model/DealModel.js";
import QuotationModel from "../model/QuotationModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";
import ProductServiceModel from "../model/ProductModel.js";

const populateOptions = {
  customer: {
    path: "customerId",
    select: "firstName lastName email phone company",
  },
  products: {
    path: "products.productId",
    select: "name price description category unit",
  },
  quotation: {
    path: "quotationId",
    select: "totalPrice finalPrice discount status createdAt",
  },
  user: { path: "userId", select: "name email" },
};

const calculatePrices = (products, discount = { type: "fixed", value: 0 }) => {
  const totalPrice = products.reduce(
    (sum, product) => sum + Number(product.price) * Number(product.quantity),
    0
  );

  let finalPrice = totalPrice;
  if (discount.value > 0) {
    finalPrice =
      discount.type === "percentage"
        ? totalPrice * (1 - discount.value / 100)
        : totalPrice - discount.value;
  }
  return { totalPrice, finalPrice: Math.round(finalPrice * 100) / 100 };
};

const validateDiscount = (discount) => {
  if (!discount) return true;
  return ["percentage", "fixed"].includes(discount.type) && discount.value >= 0;
};

export const createDeal = async (req, res) => {
  try {
    const { customerId, products, status, discount } = req.body;

    if (!customerId || !status || !products?.length) {
      return res.status(400).json({
        message: "Customer ID, status, and at least one product are required",
        body: req.body,
      });
    }

    if (!validateDiscount(discount)) {
      return res.status(400).json({
        message:
          "Invalid discount format. Type must be 'percentage' or 'fixed' and value must be non-negative",
      });
    }

    const { totalPrice, finalPrice } = calculatePrices(products, discount);

    const deal = await DealModel.create({
      userId: req.user.id,
      customerId,
      products,
      status,
    });

    const quotation = await QuotationModel.create({
      dealId: deal._id,
      products,
      totalPrice,
      finalPrice,
      discount: discount || { type: "fixed", value: 0 },
    });

    await DealModel.findByIdAndUpdate(
      deal._id,
      { quotationId: quotation._id },
      { new: true }
    );

    const populatedDeal = await DealModel.findById(deal._id).populate([
      populateOptions.customer,
      populateOptions.products,
      populateOptions.quotation,
    ]);

    successResponse(res, populatedDeal);
  } catch (error) {
    console.error("Create Deal Error:", error);
    errorResponse(res, error.message);
  }
};

export const getDealsByUser = async (req, res) => {
  try {
    const deals = await DealModel.find({ userId: req.user.id })
      .populate([
        populateOptions.customer,
        populateOptions.products,
        populateOptions.quotation,
      ])
      .sort({ createdAt: -1 })
      .lean(); // Using lean() for better performance with large datasets

    successResponse(res, {
      deals,
      total: deals.length,
    });
  } catch (error) {
    console.error("Get Deals Error:", error);
    errorResponse(res, error.message);
  }
};

export const updateDeal = async (req, res) => {
  try {
    const { customerId, products, status, discount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid deal ID format" });
    }

    const deal = await DealModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate("products.productId");

    if (!deal) {
      return res.status(404).json({
        message: "Deal not found or not authorized to update",
      });
    }

    if (products || discount) {
      if (!validateDiscount(discount)) {
        return res.status(400).json({
          message: "Invalid discount format",
        });
      }

      const { totalPrice, finalPrice } = calculatePrices(
        products || deal.products,
        discount || deal.quotationId.discount
      );

      await QuotationModel.findByIdAndUpdate(
        deal.quotationId,
        {
          products: products || deal.products,
          totalPrice,
          finalPrice,
          discount: discount || deal.quotationId.discount,
          updatedAt: Date.now(),
        },
        { new: true }
      );
    }

    // Check if status is changing to "Won" -> update product quantities
    if (status === "Won" && deal.status !== "Won") {
      for (const product of products) {
        const pd = await ProductServiceModel.findById(product.productId);
        if (pd.category === "supplement") {
          if (!pd) {
            return res.status(404).json({
              message: `Product with ID ${product.productId} not found`,
            });
          }
          if (pd.quantity < product.quantity) {
            return res.status(400).json({
              message: `Not enough quantity for product with ID ${product.productId}`,
            });
          }
          pd.stock -= product.quantity;
          await pd.save();
        }
      }
    }

    const updatedDeal = await DealModel.findByIdAndUpdate(
      req.params.id,
      {
        customerId: customerId || deal.customerId,
        products: products || deal.products,
        status: status || deal.status,
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate([
      populateOptions.customer,
      populateOptions.products,
      populateOptions.quotation,
    ]);

    if (status === "Won" && customerId) {
      await CustomerModel.findOneAndUpdate(
        { _id: customerId, status: "lead" },
        { status: "customer" },
        { new: true }
      );
    }

    successResponse(res, updatedDeal);
  } catch (error) {
    console.error("Update Deal Error:", error);
    errorResponse(res, error.message);
  }
};

export const deleteDeal = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid deal ID format" });
    }

    const deal = await DealModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deal) {
      return res.status(404).json({
        message: "Deal not found or not authorized to delete",
      });
    }

    await Promise.all([
      deal.quotationId && QuotationModel.findByIdAndDelete(deal.quotationId),
      DealModel.findByIdAndDelete(req.params.id),
    ]);

    successResponse(res, {
      message: "Deal and associated quotation deleted successfully",
    });
  } catch (error) {
    console.error("Delete Deal Error:", error);
    errorResponse(res, error.message);
  }
};

export const getDealById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid deal ID format" });
    }

    const deal = await DealModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate([
      populateOptions.customer,
      populateOptions.products,
      populateOptions.quotation,
      populateOptions.user,
    ]);

    if (!deal) {
      return res.status(404).json({
        message: "Deal not found or not authorized to view",
      });
    }

    successResponse(res, deal);
  } catch (error) {
    console.error("Get Deal By ID Error:", error);
    errorResponse(res, error.message);
  }
};
