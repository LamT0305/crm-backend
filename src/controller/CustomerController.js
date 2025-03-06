import CustomerModel from "../model/CustomerModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// Create a new customer
export const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, gender, status, sourceId } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !gender || !status || !sourceId) {
      return res.status(400).json({ message: "All fields must be provided" });
    }

    const customer = await CustomerModel.create({
      userId: req.user.id,
      name,
      email,
      phone,
      gender,
      status,
      sourceId,
    });

    successResponse(res, customer);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Get all customers for the logged-in user
export const getCustomersByUser = async (req, res) => {
  try {
    const customers = await CustomerModel.find({ userId: req.user.id })
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
      .populate("deals") // Include associated deals
      .populate("sourceId", "name");

    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    successResponse(res, customer);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

// Update customer details
export const updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, gender, status, sourceId } = req.body;

    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, gender, status, sourceId },
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
