import ActivityModel from "../model/ActivityModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createActivity = async (req, res) => {
  try {
    const { customerId, type, subject } = req.body;

    if (!customerId || !type || !subject) {
      return res.status(400).send("All fields are required");
    }

    const activity = await ActivityModel.create({
      userId: req.user.id,
      customerId: customerId,
      type,
      subject,
    });

    await activity.populate("userId", "name email");
    successResponse(res, activity);
  } catch (error) {
    errorResponse(res, "Could not create activity");
  }
};

// 📌 2. Lấy danh sách Activity theo relatedId
export const getActivities = async (req, res) => {
  try {
    const activities = await ActivityModel.find({
      userId: req.user.id,
      customerId: req.params.customerId,
    }).populate("userId", "name email");
    if (!activities) {
      return res.status(404).send("Activity not found");
    }
    successResponse(res, activities);
  } catch (error) {
    errorResponse(res, "Could not fetch activities");
  }
};

// ❌ 3. Xóa Activity
export const deleteActivity = async (req, res) => {
  try {
    const activity = await ActivityModel.findByIdAndDelete(req.params.id);
    if (!activity)
      return res.status(404).json({ message: "Activity not found" });

    successResponse(res, activity);
  } catch (error) {
    errorResponse(res, "Could not delete activity");
  }
};
