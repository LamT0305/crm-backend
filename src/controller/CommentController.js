import CommentModel from "../model/CommentModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

const populateOptions = {
  user: { path: "userId", select: "name email" },
  customer: { path: "customerId", select: "firstName lastName email" },
};

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
      workspace: req.workspaceId,
    });

    const populatedComment = await CommentModel.findById(newComment._id)
      .populate(populateOptions.user)
      .populate(populateOptions.customer);

    return successResponse(res, populatedComment);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getCommentsByCustomer = async (req, res) => {
  try {
    const comments = await CommentModel.find({
      customerId: req.params.customerId,
      workspace: req.workspaceId,
    })
      .populate(populateOptions.user)
      .populate(populateOptions.customer)
      .sort({ createdAt: -1 });

    successResponse(res, comments);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await CommentModel.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Ensure only the comment creator can delete it
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Unauthorized to delete this comment",
      });
    }

    await comment.deleteOne();
    return successResponse(res, {
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
