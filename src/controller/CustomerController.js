import CompanyModel from "../model/CompanyModel.js";
import CustomerModel from "../model/CustomerModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// Customer
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      statusId,
      companyName,
      numberOfEmployees,
      webSite,
      territory,
      industry,
    } = req.body;
    if (!name || !email || !phone || !status) {
      res.status(400).send({ message: "All fields must be provided" });
    }

    const customer = await CustomerModel.create({
      userId: req.user.id,
      name: name,
      email: email,
      phone: phone,
      statusId: statusId,
    });

    if (companyName || numberOfEmployees || webSite || territory || industry) {
      const company = await CompanyModel.create({
        name: companyName || "",
        industry: industry || "",
        webSite: webSite || "",
        territory: territory || "",
        numberOfEmployees: numberOfEmployees || 0,
      });

      customer.companyId = company._id;
      await customer.save();
    }

    successResponse(res, customer);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getCustomersByUser = async (req, res) => {
  try {
    const customers = await CustomerModel.find({
      userId: req.user.id,
    })
      .populate("statusId")
      .populate("companyId");
    successResponse(res, customers);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.params.id)
      .populate("statusId")
      .populate("companyId");
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    successResponse(res, customer);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const updatedCustomer = await CustomerModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCustomer)
      return res.status(404).json({ message: "Customer not found" });

    successResponse(res, updatedCustomer);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const updateCustomerCompany = async (req, res) => {
  try {
    const company = await CompanyModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    if (!company) {
      return res.status(404).json({ message: "company not found" });
    }
    successResponse(res, company);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
export const deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await CustomerModel.findByIdAndDelete(
      req.params.id
    );
    if (!deletedCustomer)
      return res.status(404).json({ message: "Customer not found" });
    const deletedCompany = await CompanyModel.findByIdAndDelete(
      deletedCustomer.companyId
    );
    if (!deletedCompany)
      return res.status(404).json({ message: "Company not found" });
    successResponse(res, { message: "Customer deleted successfully" });
  } catch (error) {
    errorResponse(res, "Could not delete customer");
  }
};
