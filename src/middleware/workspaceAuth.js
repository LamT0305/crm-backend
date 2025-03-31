import { errorResponse } from "../utils/responseHandler.js";
import UserModel from "../model/UserModel.js";

export const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user.workspace || !user.hasCompletedOnboarding) {
      return errorResponse(
        res,
        "No workspace access",
        "Please join or create a workspace first",
        403
      );
    }

    req.workspaceId = user.workspace;
    next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
