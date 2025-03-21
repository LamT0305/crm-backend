import express from "express";
import {
  createNote,
  deleteNote,
  getAllNotesByUser,
  getCustomerNotes,
  getNoteById,
  updateNote,
} from "../controller/NoteController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";

const router = express.Router();
router.use(verifyToken);
router.route("/get-notes").get(getAllNotesByUser);
router.route("/get-customer-notes/:id").get(getCustomerNotes);
router.route("/create-note").post(createNote);
router.route("/delete-note/:id").delete(deleteNote);
router.route("/update-note/:id").put(updateNote);
router.route("/get-note/:id").get(getNoteById);

export default router;
