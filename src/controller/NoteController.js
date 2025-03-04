import NoteModel from "../model/NoteModel.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const createNote = async (req, res) => {
  try {
    const { customerId, title, content } = req.body;

    if (!customerId || !title || !content)
      return res.status(400).json({ message: "All fields are required" });

    const note = await NoteModel.create({
      userId: req.user.id,
      customerId: customerId,
      title: title,
      content: content,
    });

    successResponse(req, note);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getAllNotesByUser = async (req, res) => {
  try {
    const notes = await NoteModel.find({ userId: req.user.id });
    if (!notes) return res.status(404).json({ message: "Note not found" });
    successResponse(req, notes);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await NoteModel.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    successResponse(req, note);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
