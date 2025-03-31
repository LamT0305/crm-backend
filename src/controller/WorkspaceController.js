import WorkspaceModel from "../model/WorkspaceModel.js";
import UserModel from "../model/UserModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import crypto from "crypto";
import { sendEmail } from "./EmailController.js";

export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    const workspace = new WorkspaceModel({
      name,
      owner: userId,
      members: [{ user: userId, role: "Admin", status: "Active" }],
    });

    await workspace.save();

    await UserModel.findByIdAndUpdate(userId, {
      workspace: workspace._id,
      hasCompletedOnboarding: true,
    });

    return successResponse(res, workspace);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    const workspace = await WorkspaceModel.findById(user.workspace);

    if (!workspace) {
      return errorResponse(res, "Workspace not found");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    workspace.invitations.push({ email, token, expiresAt });
    await workspace.save();

    // Send invitation email
    const inviteUrl = `${process.env.FRONTEND_URL}/workspace/join/${token}`;
    await sendEmail({
      to: email,
      subject: "Workspace Invitation",
      message: `You've been invited to join ${workspace.name}. Click here to join: ${inviteUrl}`,
    });

    return successResponse(res, { message: "Invitation sent successfully" });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const joinWorkspace = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    const workspace = await WorkspaceModel.findOne({
      "invitations.token": token,
    });

    if (!workspace) {
      return errorResponse(res, "Invalid or expired invitation");
    }

    const invitation = workspace.invitations.find((inv) => inv.token === token);
    if (new Date() > invitation.expiresAt) {
      return errorResponse(res, "Invitation has expired");
    }

    workspace.members.push({ user: userId, status: "Active" });
    workspace.invitations = workspace.invitations.filter(
      (inv) => inv.token !== token
    );
    await workspace.save();

    await UserModel.findByIdAndUpdate(userId, {
      workspace: workspace._id,
      hasCompletedOnboarding: true,
    });

    return successResponse(res, { message: "Joined workspace successfully" });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getWorkspaceDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user.workspace) {
      return successResponse(res, { hasWorkspace: false });
    }

    const workspace = await WorkspaceModel.findById(user.workspace)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    return successResponse(res, { hasWorkspace: true, workspace });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
