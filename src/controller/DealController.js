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
    populate: {
      path: "category",
      select: "name description",
    },
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
      workspace: req.workspaceId,
    });

    const quotation = await QuotationModel.create({
      dealId: deal._id,
      products,
      totalPrice,
      finalPrice,
      discount: discount || { type: "fixed", value: 0 },
      workspace: req.workspaceId,
    });

    const updatedDeal = await DealModel.findByIdAndUpdate(
      deal._id,
      { quotationId: quotation._id },
      { new: true }
    ).populate([
      populateOptions.customer,
      populateOptions.products,
      populateOptions.quotation,
      populateOptions.user,
    ]);

    successResponse(res, updatedDeal);
  } catch (error) {
    console.error("Create Deal Error:", error);
    errorResponse(res, error.message);
  }
};

export const getDealsByUser = async (req, res) => {
  try {
    const deals = await DealModel.find({
      workspace: req.workspaceId,
    })
      .populate([
        populateOptions.customer,
        populateOptions.products,
        populateOptions.quotation,
        populateOptions.user,
      ])
      .sort({ createdAt: -1 })
      .lean();

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
      workspace: req.workspaceId,
    }).populate("products.productId");

    if (!deal) {
      return res
        .status(404)
        .json({ message: "Deal not found or not authorized to update" });
    }

    // Refactored effective values for products and discount
    const effectiveProducts = products || deal.products;

    if (products || discount) {
      if (!validateDiscount(discount)) {
        return res.status(400).json({
          message: "Invalid discount format",
        });
      }

      const effectiveDiscount = discount || deal.quotationId.discount;
      const { totalPrice, finalPrice } = calculatePrices(
        effectiveProducts,
        effectiveDiscount
      );

      const quotation = await QuotationModel.findOneAndUpdate(
        {
          _id: deal.quotationId,
          workspace: req.workspaceId,
        },
        {
          products: effectiveProducts,
          totalPrice,
          finalPrice,
          discount: effectiveDiscount,
          updatedAt: new Date(),
        },
        { new: true }
      );

      // Update customer revenue for transitioning to Won
      if (status === "Won" && deal.status !== "Won") {
        const customer = await CustomerModel.findById(customerId);
        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }
        customer.totalRevenue += quotation.finalPrice;
        await customer.save();
      }
    }

    // Optimize stock update: concurrently update stock for each product
    if (status === "Won" && deal.status !== "Won") {
      await Promise.all(
        effectiveProducts.map(async (product) => {
          const productDoc = await ProductServiceModel.findOne({
            _id: product.productId,
            workspace: req.workspaceId,
          });

          if (!productDoc) {
            throw new Error(`Product not found: ${product.productId}`);
          }

          if (productDoc.stock > 0) {
            if (productDoc.stock < product.quantity) {
              throw new Error(
                `Insufficient stock for product: ${productDoc.name}`
              );
            }
            productDoc.stock -= product.quantity;
            await productDoc.save();
          }
        })
      );
    }

    const updatedDeal = await DealModel.findOneAndUpdate(
      {
        _id: req.params.id,
        workspace: req.workspaceId,
      },
      {
        customerId: customerId || deal.customerId,
        products: effectiveProducts,
        status: status || deal.status,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate([
      populateOptions.customer,
      populateOptions.products,
      populateOptions.quotation,
      populateOptions.user,
    ]);

    if (status === "Won") {
      await CustomerModel.findOneAndUpdate(
        {
          _id: customerId || deal.customerId,
          workspace: req.workspaceId,
          status: "lead",
        },
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
      workspace: req.workspaceId,
    });

    if (!deal) {
      return res.status(404).json({
        message: "Deal not found or not authorized to delete",
      });
    }

    await Promise.all([
      deal.quotationId &&
        QuotationModel.findOneAndDelete({
          _id: deal.quotationId,
          workspace: req.workspaceId,
        }),
      DealModel.findOneAndDelete({
        _id: req.params.id,
        workspace: req.workspaceId,
      }),
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
      workspace: req.workspaceId,
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

export const getAllDealsByCustomerId = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer ID format" });
    }

    const deals = await DealModel.find({
      customerId: req.params.id,
      workspace: req.workspaceId,
    })
      .populate([
        populateOptions.customer,
        populateOptions.products,
        populateOptions.quotation,
        populateOptions.user,
      ])
      .sort({ createdAt: -1 })
      .lean();

    successResponse(res, {
      deals,
      total: deals.length,
    });
  } catch (error) {
    console.error("Get Deals By Customer Error:", error);
    errorResponse(res, error.message);
  }
};
