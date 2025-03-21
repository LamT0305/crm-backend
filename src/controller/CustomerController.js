import mongoose from "mongoose";
import CustomerModel from "../model/CustomerModel.js";
import UserModel from "../model/UserModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

const populateOptions = {
  source: { path: "sourceId", select: "name" },
  deals: { path: "deals" },
  user: { path: "userId", select: "name email" },
};

const validateCustomerData = (data) => {
  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "gender",
    "monthlyIncome",
    "sourceId",
    "industry",
  ];
  const missingFields = requiredFields.filter((field) => !data[field]);
  return missingFields.length === 0
    ? null
    : `Missing fields: ${missingFields.join(", ")}`;
};

export const createCustomer = async (req, res) => {
  try {
    const validationError = validateCustomerData(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { email } = req.body;
    const isExisted = await CustomerModel.findOne({ email }).lean();
    if (isExisted) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const customer = await CustomerModel.create({
      ...req.body,
      userId: req.user.id,
    });

    const populatedCustomer = await customer.populate(populateOptions.source);
    successResponse(res, populatedCustomer);
  } catch (error) {
    console.error("Create Customer Error:", error);
    errorResponse(res, error.message);
  }
};

export const getLeadsByUser = async (req, res) => {
  try {
    const leads = await CustomerModel.find({
      userId: req.user.id,
      status: "lead",
    })
      .populate([populateOptions.source, populateOptions.deals])
      .sort({ createdAt: -1 })
      .lean();

    successResponse(res, {
      leads,
      total: leads.length,
    });
  } catch (error) {
    console.error("Get Leads Error:", error);
    errorResponse(res, error.message);
  }
};

export const getCustomersByUser = async (req, res) => {
  try {
    const customers = await CustomerModel.find({
      userId: req.user.id,
      status: "customer",
    })
      .populate([populateOptions.source, populateOptions.deals])
      .sort({ createdAt: -1 })
      .lean();

    successResponse(res, {
      customers,
      total: customers.length,
    });
  } catch (error) {
    console.error("Get Customers Error:", error);
    errorResponse(res, error.message);
  }
};

export const getCustomerById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer ID format" });
    }

    const customer = await CustomerModel.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate([populateOptions.source, populateOptions.user]);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    successResponse(res, customer);
  } catch (error) {
    console.error("Get Customer Error:", error);
    errorResponse(res, error.message);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer ID format" });
    }

    const validationError = validateCustomerData(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const customer = await CustomerModel.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    ).populate(populateOptions.source);

    if (!customer) {
      return res
        .status(404)
        .json({ message: "Customer not found or not authorized to update" });
    }

    successResponse(res, customer);
  } catch (error) {
    console.error("Update Customer Error:", error);
    errorResponse(res, error.message);
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid customer ID format" });
    }

    const customer = await CustomerModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!customer) {
      return res
        .status(404)
        .json({ message: "Customer not found or not authorized to delete" });
    }

    successResponse(res, { message: "Customer deleted successfully" });
  } catch (error) {
    console.error("Delete Customer Error:", error);
    errorResponse(res, "Could not delete customer");
  }
};
