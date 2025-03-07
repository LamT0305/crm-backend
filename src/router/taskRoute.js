import express from "express";
import {
  createTask,
  deleteTask,
  getAllTasksByUser,
  getTasksBetweenUserAndCustomer,
  updateTask,
} from "../controller/TaskController.js";
import { verifyToken } from "../middleware/authMiddleWare.js";
const router = express.Router();

router.use(verifyToken);
router.route("/create-task").post(createTask);
router.route("/update-task/:id").post(updateTask);
router.route("/delete-task/:id").post(deleteTask);
router.route("/get-tasks").get(getAllTasksByUser);
router
  .route("/get-task-between-user-and-customer")
  .post(getTasksBetweenUserAndCustomer);

export default router;
