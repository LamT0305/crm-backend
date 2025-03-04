import express from "express";
import { getEmails, sendEmail } from "../controller/EmailController.js";

const router = express.Router();

router.route("/send").post(sendEmail);
router.route("/get-emails").post(getEmails);

export default router;
