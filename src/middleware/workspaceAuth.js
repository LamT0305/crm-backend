import { errorResponse } from "../utils/responseHandler.js";
import UserModel from "../model/UserModel.js";

export const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user.workspaces?.length || !user.hasCompletedOnboarding) {
      return errorResponse(
        res,
        "No workspace access",
        "Please join or create a workspace first",
        403
      );
    }

    // Use currentWorkspace instead of workspace
    if (!user.currentWorkspace) {
      return errorResponse(
        res,
        "No active workspace",
        "Please select a workspace first",
        403
      );
    }

    req.workspaceId = user.currentWorkspace;
    next();
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
