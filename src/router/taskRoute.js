import express from "express";
import {
  createTask,
  deleteTask,
  getAllTasksByUser,
  getTaskById,
  getTasksBetweenUserAndCustomer,
  updateTask,
} from "../controller/TaskController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
const router = express.Router();

router.use(verifyToken);
router.route("/create-task").post(createTask);
router.route("/update-task/:id").put(updateTask);
router.route("/delete-task/:id").delete(deleteTask);
router.route("/get-tasks").get(getAllTasksByUser);
router.route("/get-tasks-of-customer/:id").get(getTasksBetweenUserAndCustomer);
router.route("/get-task/:id").get(getTaskById);

export default router;
