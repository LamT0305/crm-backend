import DealModel from "../model/DealModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const createDeal = async (res, req) => {
  try {
    const { customerId, annualRevenue, statusId } = req.body;

    if (!customerId || !annualRevenue || !statusId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const deal = await DealModel.create({
      userId: request.user.id,
      customerId: customerId,
      annualRevenue: annualRevenue,
      statusId: statusId,
    });

    successResponse(req, deal);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const updateDealStatus = async (req, res, next) => {
  try {
    const { statusId } = req.body;
    const deal = await DealModel.findByIdAndUpdate(
      req.params.id,
      {
        statusId: statusId,
      },
      {
        new: true,
      }
    );

    if (!deal) return res.status(404).json({ message: "Deal not found" });

    successResponse(req, deal);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getDealByUser = async (req, res) => {
  try {
    const deals = await DealModel.find({ userId: req.user.id })
      .populate("customerId")
      .populate("statusId");
    successResponse(res, deals);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteDeal = async (req, res) => {
  try {
    const deleteDeal = await DealModel.findByIdAndDelete(req.params.id);

    if (!deleteDeal) {
      return res.status(404).send({ message: "Couldn't find a deal" });
    }
    successResponse(res, deleteDeal);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
