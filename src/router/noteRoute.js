import express from "express";
import {
  createNote,
  deleteNote,
  getAllNotesByUser,
} from "../controller/NoteController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";

const router = express.Router();
router.use(verifyToken);
router.route("/get-notes").get(getAllNotesByUser);
router.route("/create-note").post(createNote);
router.route("/delete-note/:id").delete(deleteNote);

export default router;