import WorkspaceModel from "../model/WorkspaceModel.js";
import UserModel from "../model/UserModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import crypto from "crypto";
import { sendInvitationEmail } from "./EmailController.js";
import NotificationModel from "../model/NotificationModel.js";
import { getIO } from "../socket.js";

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

    // Update user's workspaces array
    await UserModel.findByIdAndUpdate(userId, {
      $push: { workspaces: { workspace: workspace._id, isOwner: true } },
      hasCompletedOnboarding: true,
      currentWorkspace: workspace._id,
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

    if (!email) {
      return errorResponse(res, "Email is required");
    }
    const recipient = await UserModel.findOne({ email: email });
    if (!recipient) {
      return errorResponse(res, "User not found");
    }
    // Check if user is already a member of the workspace
    const existingMember = workspace.members.find(
      (m) => m.user.toString() === recipient._id.toString()
    );
    if (existingMember) {
      return errorResponse(res, "User is already a member of the workspace");
    }

    const user = await UserModel.findById(userId);
    const workspace = await WorkspaceModel.findById(user.currentWorkspace);

    if (!workspace) {
      return errorResponse(res, "Workspace not found");
    }

    // Check if user has admin rights
    const memberRecord = workspace.members.find(
      (m) => m.user.toString() === userId && m.role === "Admin"
    );
    if (!memberRecord) {
      return errorResponse(res, "Only admins can invite members", 403);
    }

    // generate token
    const token = crypto.randomBytes(32).toString("hex");
    // set expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 1 day from now

    // Save invitation before sending email
    workspace.invitations.push({
      email,
      token,
      expiresAt,
    });
    await workspace.save();

    const INVITATION_URL = `${process.env.FRONTEND_URL}/join-workspace/${token}`;
    await sendInvitationEmail({
      email,
      subject: "Workspace Invitation",
      message: `You have been invited to join the workspace "${workspace.name}" by ${user.name}. Please click the link below to accept the invitation: ${INVITATION_URL}`,
    });

    // notification
    const notification = {
      userId: recipient._id,
      title: "Workspace Invitation",
      message: `You have been invited to join the workspace "${workspace.name}" by ${user.name}.`,
      link: INVITATION_URL,
      workspace: workspace._id,
    };

    await NotificationModel.create(notification);

    const io = getIO();
    io.to(recipient._id.toString()).emit("notiInvite", notification);

    return successResponse(res, {
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.log(error);
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

    workspace.members.push({ user: userId, role: "Member", status: "Active" });
    workspace.invitations = workspace.invitations.filter(
      (inv) => inv.token !== token
    );
    await workspace.save();

    // Update user's workspaces array
    await UserModel.findByIdAndUpdate(userId, {
      $push: { workspaces: { workspace: workspace._id, isOwner: false } },
      currentWorkspace: workspace._id,
      hasCompletedOnboarding: true,
    });

    // notification
    const notification = {
      userId: workspace.owner,
      title: "New Member Joined",
      message: `${user.name} has joined the workspace "${workspace.name}".`,
      link: "",
      workspace: workspace._id,
    };
    await NotificationModel.create(notification);
    const io = getIO();
    io.to(workspace.owner.toString()).emit("notiJoin", notification);
    return successResponse(res, { message: "Joined workspace successfully" });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getWorkspaceDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId);

    if (!user.currentWorkspace) {
      return successResponse(res, { hasWorkspace: false });
    }

    const workspace = await WorkspaceModel.findById(user.currentWorkspace)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!workspace) {
      return errorResponse(res, "Workspace not found");
    }

    const userRole = workspace.members.find(
      (m) => m.user._id.toString() === userId
    )?.role;

    return successResponse(res, {
      hasWorkspace: true,
      workspace,
      userRole,
      isOwner: workspace.owner._id.toString() === userId,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const switchWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.body;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    const hasAccess = user.workspaces.some(
      (ws) => ws.workspace.toString() === workspaceId
    );

    if (!hasAccess) {
      return errorResponse(res, "No access to this workspace", 403);
    }

    user.currentWorkspace = workspaceId;
    await user.save();

    await user.populate({
      path: "currentWorkspace",
      select: "name",
    });

    return successResponse(res, {
      message: "Workspace switched successfully",
      currentWorkspace: user.currentWorkspace,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const userWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId)
      .populate({
        path: "workspaces.workspace",
        populate: {
          path: "owner",
          select: "name email",
        },
      })
      .populate({
        path: "currentWorkspace",
        select: "name",
      });

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const workspaces = user.workspaces.map((ws) => ({
      _id: ws.workspace._id,
      name: ws.workspace.name,
      isOwner: ws.isOwner,
      owner: ws.workspace.owner,
      isActive:
        user.currentWorkspace?.toString() === ws.workspace._id.toString(),
    }));

    return successResponse(res, {
      workspaces,
      currentWorkspace: user.currentWorkspace,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
