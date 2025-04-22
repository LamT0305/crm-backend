import UserModel from "../model/UserModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import fs from "fs";

export const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, gender, birthday, bio, userName } = req.body;
    const updates = {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(gender && { gender }),
      ...(birthday && { birthday: new Date(birthday) }),
      ...(bio && { bio }),
      ...(userName && { userName }),
    };

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, "No valid fields to update", 400);
    }

    if (req.file) {
      const user = await UserModel.findById(req.user.id);
      if (user?.avatar) {
        const oldAvatarPath = `uploads/${user.avatar.split("/").pop()}`;
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).select("-password -refreshToken -accessToken");

    if (!updatedUser) {
      return errorResponse(res, "User not found", 404);
    }

    successResponse(res, updatedUser);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const viewListUsers = async (req, res) => {
  try {
    const users = await UserModel.find({
      _id: { $ne: req.user.id }, // Exclude current user
    })
      .select("-password -refreshToken -accessToken")
      .sort({ createdAt: -1 });

    successResponse(res, users);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const viewListUsersInWorkspace = async (req, res) => {
  try {
    const users = await UserModel.find({
      workspaces: {
        $elemMatch: {
          workspace: req.workspaceId,
        },
      },
      _id: { $ne: req.user.id },
    })
      .select("-password -refreshToken -accessToken")
      .sort({ createdAt: -1 });
    successResponse(res, users);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await UserModel.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    }).select("-password -refreshToken -accessToken");

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    successResponse(res, user);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
