import NoteModel from "../model/NoteModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const createNote = async (req, res) => {
  try {
    const { customerId, title, content } = req.body;

    if (!customerId || !title || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const note = await NoteModel.create({
      userId: req.user.id,
      customerId,
      title,
      content,
      workspace: req.workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const populatedNote = await note.populate([
      { path: "customerId", select: "firstName lastName email" },
      { path: "userId", select: "name email" },
    ]);

    successResponse(res, populatedNote);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getAllNotesByUser = async (req, res) => {
  try {
    const notes = await NoteModel.find({
      workspace: req.workspaceId,
    })
      .populate("customerId", "firstName lastName email")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    successResponse(res, notes);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getCustomerNotes = async (req, res) => {
  try {
    const notes = await NoteModel.find({
      workspace: req.workspaceId,
      customerId: req.params.id,
    })
      .populate("customerId", "firstName lastName email")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    successResponse(res, notes);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await NoteModel.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    successResponse(res, { message: "Note deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await NoteModel.findOneAndUpdate(
      {
        _id: req.params.id,
        workspace: req.workspaceId,
      },
      {
        title,
        content,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate([
      { path: "customerId", select: "firstName lastName email" },
      { path: "userId", select: "name email" },
    ]);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    successResponse(res, note);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await NoteModel.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    })
      .populate("customerId", "firstName lastName email")
      .populate("userId", "name email");

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    successResponse(res, note);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
