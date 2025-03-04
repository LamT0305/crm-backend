import UserModel from "../model/UserModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import fs from "fs";

// Read + update user profile

export const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (user) {
      return res.status(404).json({ message: "User not found" });
    }

    successResponse(req, user);
  } catch (error) {
    errorResponse(req, error.message);
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let updates = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    if (req.user.id !== user._id) {
      return res
        .status(403)
        .send("You don't have permission to update this user");
    }

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar if exists
      if (user.avatar) {
        const oldAvatarPath = `uploads/${user.avatar.split("/").pop()}`;
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      // Save new avatar URL
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    // Update user info
    const updatedUser = await UserModel.findByIdAndUpdate(userId, updates, {
      new: true,
    });

    return successResponse(res, updatedUser);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const setUserRole = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .send("You don't have permission to access this page");
    }

    const { role } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      {
        role: role,
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    successResponse(req, user);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const viewListUsers = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res
        .status(403)
        .send("You don't have permission to access this page");
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await UserModel.find().skip(skip).limit(limit);

    // Get total count of users
    const totalUsers = await UserModel.countDocuments();

    // Return paginated response
    const result = {
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    };
    return successResponse(res, result);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    successResponse(req, user);
  } catch (error) {
    errorResponse(req, error.message);
  }
};
