import CommentModel from "../model/CommentModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { customerId, content } = req.body;
    const userId = req.user.id;

    if (!customerId || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newComment = await CommentModel.create({
      userId,
      customerId,
      content,
    });

    (await newComment.populate("userId")).populate("customerId");
    return res.status(200).json({ message: "success", comment: newComment });
  } catch (error) {
    return errorResponse(res, error);
  }
};

// Get all comments for a customer
export const getCommentsByCustomer = async (req, res) => {
  try {
    const comments = await CommentModel.find({
      userId: req.user.id,
      customerId: req.params.id,
    })
      .populate("userId", "name email")
      .populate("customerId")
      .sort({ createdAt: -1 });

    return successResponse(res, comments);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;

    const comment = await CommentModel.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Ensure only the comment creator can delete it
    if (comment.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this comment" });
    }

    await CommentModel.findByIdAndDelete(req.params.id);
    return successResponse(res, comment);
  } catch (error) {
    return errorResponse(res, error);
  }
};
