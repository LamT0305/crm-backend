import express from "express";
import { getEmails, sendEmail } from "../controller/EmailController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
import upload from "../utils/multerConfig.js";

const router = express.Router();
router.use(verifyToken);
router.route("/send").post(sendEmail);
router.route("/get-emails").post(getEmails);

export default router;
