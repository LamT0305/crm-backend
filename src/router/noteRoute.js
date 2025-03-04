import express from "express";
import authMiddleWare from "../middleware/authMiddleWare.js";
import {
  createNote,
  deleteNote,
  getAllNotesByUser,
} from "../controller/NoteController.js";

const router = express.Router();

router.use(authMiddleWare);
router.route("/get-notes").get(getAllNotesByUser);
router.route("/create-note").post(createNote);
router.route("/delete-note/:id").delete(deleteNote);

export default router;