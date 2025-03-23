import express from "express";
import {
  getEmails,
  handleDeleteEmail,
  sendEmail,
} from "../controller/EmailController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";

const router = express.Router();
router.use(verifyToken);
router.route("/send").post(sendEmail);
router.route("/get-emails").post(getEmails);
router.route("/delete-email/:id").delete(handleDeleteEmail);

export default router;
