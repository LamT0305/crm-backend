import express from "express";
import {
  createNote,
  deleteNote,
  getAllNotesByUser,
} from "../controller/NoteController.js";

const router = express.Router();

router.route("/get-notes").get(getAllNotesByUser);
router.route("/create-note").post(createNote);
router.route("/delete-note/:id").delete(deleteNote);

export default router;