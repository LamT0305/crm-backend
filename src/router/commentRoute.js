import express from "express";
import { verifyToken } from "../middleware/authMiddleWare.js";
import {
  createComment,
  deleteComment,
  getCommentsByCustomer,
} from "../controller/CommentController.js";

const router = express.Router();

router.use(verifyToken);
router.route("/get-comments/:id").get(getCommentsByCustomer);
router.route("/create-comment").post(createComment);
router.route("/delete-comment/:id").delete(deleteComment);
export default router;

