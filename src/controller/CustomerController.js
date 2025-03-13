import mongoose from "mongoose";
import CustomerModel from "../model/CustomerModel.js";
import UserModel from "../model/UserModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// Create a new customer
export const createCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      monthlyIncome,
      sourceId,
      industry,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !gender ||
      !monthlyIncome ||
      !sourceId ||
      !industry
    ) {
      return res.status(400).json({ message: "All fields must be provided" });
    }
    const userId = new mongoose.Types.ObjectId(String(req.user.id));

    const customer = await CustomerModel.create({
      userId: userId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      gender: gender,
      monthlyIncome: monthlyIncome,
      sourceId: sourceId,
      industry: industry,
    });

    customer.populate("sourceId", "name");
    successResponse(res, customer);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get all customers for the logged-in user
export const getLeadsByUser = async (req, res) => {
  try {
    const customers = await CustomerModel.find({
      userId: req.user.id,
      status: "lead",
    })
      .populate("deals") // Include associated deals
      .populate("sourceId", "name") // Populate Source info (only `name`)
      .sort({ createdAt: -1 });

    successResponse(res, customers);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getCustomersByUser = async (req, res) => {
  try {
    const customers = await CustomerModel.find({
      userId: req.user.id,
      status: "customer",
    })
      .populate("deals") // Include associated deals
      .populate("sourceId", "name") // Populate Source info (only `name`)
      .sort({ createdAt: -1 });

    successResponse(res, customers);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get a single customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.params.id)
      .populate("sourceId", "name")
      .populate("userId", "name");
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    // successResponse(res, customer);
    res.status(200).json({ data: customer });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Update customer details
export const updateCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      monthlyIncome,
      sourceId,
      industry,
    } = req.body;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !gender ||
      !monthlyIncome ||
      !sourceId ||
      !industry
    ) {
      return res.status(400).json({ message: "All fields must be provided" });
    }
    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      req.params.id,
      {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        gender: gender,
        monthlyIncome: monthlyIncome,
        sourceId: sourceId,
        industry: industry,
      },
      { new: true }
    );

    if (!updatedCustomer)
      return res.status(404).json({ message: "Customer not found" });

    successResponse(res, updatedCustomer);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await CustomerModel.findByIdAndDelete(
      req.params.id
    );
    if (!deletedCustomer)
      return res.status(404).json({ message: "Customer not found" });

    successResponse(res, { message: "Customer deleted successfully" });
  } catch (error) {
    errorResponse(res, "Could not delete customer");
  }
};
