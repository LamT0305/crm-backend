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

    successResponse(res, note);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getAllNotesByUser = async (req, res) => {
  try {
    const notes = await NoteModel.find({ userId: req.user.id })
      .populate("customerId", "name email")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    if (!notes) return res.status(404).json({ message: "Note not found" });
    successResponse(res, notes);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getCustomerNotes = async (req, res) => {
  try {
    const notes = await NoteModel.find({
      userId: req.user.id,
      customerId: req.params.id,
    })
      .populate("customerId", "firstName email")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    if (!notes) return res.status(404).send("Notes not found");
    successResponse(res, notes);
  } catch (error) {
    return errorResponse(res, error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await NoteModel.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    successResponse(res, note);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await NoteModel.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found");

    note.content = content;
    note.title = title;
    await note.save();

    successResponse(res, note);
  } catch (error) {
    return errorResponse(res, error);
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await NoteModel.findById(req.params.id)
      .populate("customerId", "name ")
      .populate("userId", "name ");
    if (!note) return res.status(404).send("Note not found");
    successResponse(res, note);
  } catch (error) {
    return errorResponse(res, error);
  }
};
