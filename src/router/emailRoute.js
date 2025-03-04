import express from "express";
import { sendEmail } from "../controller/EmailController.js";
import { restoreUser } from "../middleware/authMiddleWare.js";

const router = express.Router();

router.route("/send", restoreUser).post(sendEmail);

export default router;
