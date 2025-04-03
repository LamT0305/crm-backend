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

    // Initialize workspace after retrieving user
    const user = await UserModel.findById(userId);
    const workspace = await WorkspaceModel.findById(user.currentWorkspace);

    if (!workspace) {
      return errorResponse(res, "Workspace not found");
    }

    // Check if user is already a member of the workspace
    const existingMember = workspace.members.find(
      (m) => m.user.toString() === recipient._id.toString()
    );
    if (existingMember) {
      return errorResponse(res, "User is already a member of the workspace");
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
    const notification = await NotificationModel.create({
      userId: recipient._id,
      title: "Workspace Invitation",
      message: `You have been invited to join the workspace "${workspace.name}" by ${user.name}.`,
      status: "Unread",
      link: INVITATION_URL,
      workspace: workspace._id,
    });

    await notification.populate("userId", "email name");

    const io = getIO();
    io.to(`user_${recipient._id}`).emit("notiInvite", {
      type: "workspace_invite",
      data: notification,
    });

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
    const user = await UserModel.findById(userId);
    const notification = await NotificationModel.create({
      userId: workspace.owner,
      title: "New Member Joined",
      message: `${user.name} has joined the workspace "${workspace.name}".`,
      status: "Unread",
      link: `${process.env.FRONTEND_URL}/setting`,
      workspace: workspace._id,
    });

    await notification.populate("userId", "email name");

    const io = getIO();
    io.to(`user_${workspace.owner}`).emit("notiJoin", {
      type: "workspace_join",
      data: notification.title,
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

export const updateWorkspaceName = async (req, res) => {
  try {
    const { workspaceId, name } = req.body;
    const userId = req.user.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
      return errorResponse(res, "Workspace not found", 404);
    }
    const memberRecord = workspace.members.find(
      (m) => m.user.toString() === userId && m.role === "Admin"
    );
    if (!memberRecord) {
      return errorResponse(res, "Only admins can update workspace name", 403);
    }
    workspace.name = name;
    await workspace.save();

    await workspace.populate({
      path: "members.user",
      select: "name email",
    });

    await workspace.populate("owner", "name email");

    // Notify all members about the update
    const notifications = workspace.members.map(async (member) => {
      const notification = await NotificationModel.create({
        userId: member.user._id,
        title: "Workspace Updated",
        message: `The workspace "${workspace.name}" has been updated.`,
        status: "Unread",
        workspace: workspace._id,
      });
      return notification.populate("userId", "email name");
    });

    await Promise.all(notifications);
    const io = getIO();
    console.log("Emitting to members:", workspace.members);
    workspace.members
      .filter((member) => member.role === "Member")
      .forEach((member) => {
        const roomId = `user_${member.user._id.toString()}`;
        console.log("Emitting to room:", roomId);
        io.to(roomId).emit("workspaceUpdated", {
          type: "workspace_update",
          data: {
            message: `The workspace "${workspace.name}" has been updated.`,
            workspaceId: workspace._id,
            workspace: workspace,
          },
        });
      });

    return successResponse(res, {
      message: "Workspace name updated successfully",
      workspace,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
      return errorResponse(res, "Workspace not found", 404);
    }
    const memberRecord = workspace.members.find(
      (m) => m.user.toString() === userId && m.role === "Admin"
    );
    if (!memberRecord) {
      return errorResponse(res, "Only admins can delete workspace", 403);
    }
    // Update currentWorkspace for all members
    await Promise.all(
      workspace.members.map(async (member) => {
        const memberUser = await UserModel.findById(member.user);
        if (memberUser) {
          // Remove workspace from user's workspaces array
          memberUser.workspaces = memberUser.workspaces.filter(
            (ws) => ws.workspace.toString() !== workspaceId
          );

          // Update currentWorkspace if needed
          if (memberUser.currentWorkspace?.toString() === workspaceId) {
            memberUser.currentWorkspace =
              memberUser.workspaces[0]?.workspace || null;
          }
          await memberUser.save();
        }
      })
    );

    // Notify all members about the update
    const notifications = workspace.members.map(async (member) => {
      const notification = await NotificationModel.create({
        userId: member.user._id,
        title: "Workspace Updated",
        message: `The workspace "${workspace.name}" has been delete.`,
        status: "Unread",
        workspace: workspace._id,
      });
      return notification.populate("userId", "email name");
    });

    await Promise.all(notifications);
    const io = getIO();
    console.log("Emitting to members:", workspace.members);
    workspace.members
      .filter((member) => member.role === "Member")
      .forEach((member) => {
        const roomId = `user_${member.user._id.toString()}`;
        console.log("Emitting to room:", roomId);
        io.to(roomId).emit("workspaceDeleted", {
          type: "workspace_delete",
          data: {
            message: `The workspace "${workspace.name}" has been deleted.`,
            workspaceId: workspace._id,
            workspace: workspace,
          },
        });
      });
    await workspace.deleteOne();

    return successResponse(res, {
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const leaveWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
      return errorResponse(res, "Workspace not found", 404);
    }
    const memberRecord = workspace.members.find(
      (m) => m.user.toString() === userId
    );
    if (!memberRecord) {
      return errorResponse(res, "You are not a member of this workspace", 403);
    }
    if (memberRecord.role === "Admin") {
      return errorResponse(res, "Admins cannot leave the workspace", 403);
    }
    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== userId
    );
    await workspace.save();
    user.workspaces = user.workspaces.filter(
      (ws) => ws.workspace.toString() !== workspaceId
    );
    // If deleted workspace was current, find the next available workspace
    if (user.currentWorkspace?.toString() === workspaceId) {
      // Get the first available workspace, if any
      const nextWorkspace = user.workspaces[0]?.workspace || null;
      user.currentWorkspace = nextWorkspace;
    }
    await user.save();

    const adminMember = workspace.members.find((m) => m.role === "Admin");
    if (adminMember) {
      const notification = await NotificationModel.create({
        userId: adminMember.user._id,
        title: "Workspace Leaved",
        message: `${user.name} has been leaved from the workspace "${workspace.name}"`,
        status: "Unread",
        link: `${process.env.FRONTEND_URL}/setting`,
        workspace: workspace._id,
      });
      await notification.populate("userId", "email name");

      const io = getIO();

      io.to(`user_${adminMember.user._id.toString()}`).emit("notiLeaveWS", {
        data: notification,
      });
    }

    return successResponse(res, {
      message: "Left workspace successfully",
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const deleteMember = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const currentUserId = req.user.id;
    const currentUser = await UserModel.findById(currentUserId);
    if (!currentUser) {
      return errorResponse(res, "User not found", 404);
    }
    const userDelete = await UserModel.findById(userId);

    if (!userDelete) {
      return errorResponse(res, "User delete not found", 404);
    }

    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
      return errorResponse(res, "Workspace not found", 404);
    }
    const memberRecord = workspace.members.find(
      (m) => m.user.toString() === currentUserId && m.role === "Admin"
    );
    if (!memberRecord) {
      return errorResponse(res, "Only admins can delete members", 403);
    }
    const memberToDelete = workspace.members.find(
      (m) => m.user.toString() === userId
    );
    if (!memberToDelete) {
      return errorResponse(res, "Member not found", 404);
    }
    if (memberToDelete.role === "Admin") {
      return errorResponse(res, "Admins cannot be deleted", 403);
    }
    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== userId
    );
    await workspace.save();

    userDelete.workspaces = userDelete.workspaces.filter(
      (ws) => ws.workspace.toString() !== workspaceId
    );

    if (userDelete.currentWorkspace?.toString() === workspaceId) {
      // Get the first available workspace, if any
      const nextWorkspace = userDelete.workspaces[0]?.workspace || null;
      userDelete.currentWorkspace = nextWorkspace;
    }
    await userDelete.save();

    const notification = await NotificationModel.create({
      userId: userId,
      title: "Workspace Removal",
      message: `You have been removed from the workspace "${workspace.name}"`,
      status: "Unread",
      workspace: workspace._id,
    });

    // Emit socket event to notify the user
    const io = getIO();
    io.to(`user_${userId}`).emit("workspaceRemoval", {
      type: "workspace_removal",
      data: notification,
    });
    return successResponse(res, {
      message: "Member deleted successfully",
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
