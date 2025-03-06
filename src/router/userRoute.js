import express from "express";
import upload from "../utils/multerConfig.js";
import {
  getUserById,
  setUserRole,
  updateUserProfile,
  viewListUsers,
} from "../controller/UserController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
const router = express.Router();

router.use(verifyToken);
router.route("/update-user", upload.single("avatar")).put(updateUserProfile);
router.route("/set-role/:id").put(setUserRole);
router.route("/view-list-users").get(viewListUsers);
router.route("/get-user/:id").get(getUserById);
export default router;
