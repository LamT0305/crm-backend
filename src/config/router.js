import authRouter from "../router/authRoute.js";
import userRouter from "../router/userRoute.js";
import dealRouter from "../router/dealRoute.js";
import noteRouter from "../router/noteRoute.js";
import taskRouter from "../router/taskRoute.js";
import sourceRoute from "../router/sourceRoute.js";
import customerRoute from "../router/customerRoute.js";
import activityRoute from "../router/activityRoute.js";
import emailRoute from "../router/emailRoute.js";
import quotationRoute from "../router/quotationRoute.js";
import productServiceRoute from "../router/productServiceRoute.js";
import customerCareRoute from "../router/customerCareRoute.js";

export const appRouter = (app) => {
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/deal", dealRouter);
  app.use("/api/v1/note", noteRouter);
  app.use("/api/v1/task", taskRouter);
  app.use("/api/v1/source", sourceRoute);
  app.use("/api/v1/customer", customerRoute);
  app.use("/api/v1/activity", activityRoute);
  app.use("/api/v1/email", emailRoute);
  app.use("/api/v1/quotation", quotationRoute);
  app.use("/api/v1/product", productServiceRoute);
  app.use("/api/v1/customer-care", customerCareRoute);
};
