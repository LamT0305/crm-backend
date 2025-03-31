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
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Note routes
router.get("/", getAllNotesByUser);
router.get("/customer/:id", getCustomerNotes);
router.post("/", createNote);
router.delete("/:id", deleteNote);
router.put("/:id", updateNote);
router.get("/:id", getNoteById);

export default router;
