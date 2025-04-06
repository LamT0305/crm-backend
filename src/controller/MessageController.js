import MessageModel from "../model/MessageModel.js";
import GroupModel from "../model/GroupModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { getIO } from "../socket.js";
import UserModel from "../model/UserModel.js";

const populateOptions = {
  path: "sender receiver",
  select: "name email",
};

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const message = await MessageModel.create({
      sender: req.user.id,
      receiver: receiverId,
      content,
      workspace: req.workspaceId,
    });

    const populatedMessage = await message.populate(populateOptions);

    const io = getIO();
    io.to(`user_${receiverId}`).emit("newMessage", populatedMessage);
    io.to(`user_${req.user.id}`).emit("newMessage", populatedMessage);

    successResponse(res, populatedMessage);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await MessageModel.find({
      workspace: req.workspaceId,
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    })
      .populate(populateOptions)
      .sort({ createdAt: 1 });

    if (!messages) {
      return successResponse(res, []);
    }
    await MessageModel.updateMany(
      {
        receiver: req.user.id,
        sender: userId,
        isRead: false,
      },
      { isRead: true }
    );

    const io = getIO();
    io.to(`user_${userId}`).emit("messagesRead", {
      reader: req.user.id,
      conversation: userId,
    });

    successResponse(res, messages);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getConversations = async (req, res) => {
  try {
    // Get all messages where user is either sender or receiver
    const messages = await MessageModel.find({
      workspace: req.workspaceId,
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    })
      .sort({ createdAt: -1 })
      .populate("sender receiver", "name email");

    // Create a map to store unique conversations
    const conversationsMap = new Map();

    messages.forEach((message) => {
      // Skip messages where sender or receiver is undefined
      if (!message.sender || !message.receiver) return;

      // Determine the other user in the conversation
      const otherUserId =
        message.sender._id.toString() === req.user.id.toString()
          ? message.receiver._id
          : message.sender._id;

      if (!conversationsMap.has(otherUserId.toString())) {
        const otherUser =
          message.sender._id.toString() === req.user.id.toString()
            ? message.receiver
            : message.sender;

        // Skip if otherUser is undefined
        if (!otherUser) return;

        conversationsMap.set(otherUserId.toString(), {
          _id: otherUserId,
          name: otherUser.name || "Unknown",
          email: otherUser.email || "Unknown",
          lastMessage: message,
          unreadCount: 0,
        });
      }
    });

    // Count unread messages for each conversation
    for (let [userId, conversation] of conversationsMap) {
      const unreadCount = await MessageModel.countDocuments({
        workspace: req.workspaceId,
        sender: userId,
        receiver: req.user.id,
        isRead: false,
      });
      conversation.unreadCount = unreadCount;
    }

    const conversations = Array.from(conversationsMap.values());
    successResponse(res, conversations);
  } catch (error) {
    console.error("GetConversations Error:", error); // Add error logging
    errorResponse(res, error.message);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await MessageModel.findOneAndUpdate(
      { _id: messageId, receiver: req.user.id },
      { isRead: true },
      { new: true }
    ).populate(populateOptions);

    if (!message) {
      return errorResponse(res, "Message not found", 404);
    }

    const io = getIO();
    io.to(`user_${message.sender.toString()}`).emit("messageRead", message);
    successResponse(res, message);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;

    const group = await GroupModel.create({
      name,
      members: [...members],
      workspace: req.workspaceId,
      creator: req.user.id,
    });

    const populatedGroup = await group.populate("members", "name email");

    const io = getIO();
    members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("newGroup", populatedGroup);
    });

    successResponse(res, populatedGroup);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId, content } = req.body;

    const group = await GroupModel.findOne({
      _id: groupId,
      members: req.user.id,
      workspace: req.workspaceId,
    });

    if (!group) {
      return errorResponse(res, "Group not found or access denied", 404);
    }

    const message = await MessageModel.create({
      sender: req.user.id,
      group: groupId,
      content,
      workspace: req.workspaceId,
      isGroupMessage: true,
    });

    const populatedMessage = await message.populate([
      { path: "sender", select: "name email" },
      { path: "group", select: "name members" },
    ]);

    const io = getIO();
    group.members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("newGroupMessage", {
        groupId,
        message: populatedMessage,
      });
    });

    successResponse(res, populatedMessage);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await GroupModel.findOne({
      _id: groupId,
      members: req.user.id,
      workspace: req.workspaceId,
    });

    if (!group) {
      return errorResponse(res, "Group not found or access denied", 404);
    }

    const messages = await MessageModel.find({
      group: groupId,
      workspace: req.workspaceId,
      isGroupMessage: true,
    })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    // Mark all messages as read for the current user
    await MessageModel.updateMany(
      {
        group: groupId,
        workspace: req.workspaceId,
        isGroupMessage: true,
        "readBy.userId": { $ne: req.user.id },
      },
      {
        $addToSet: {
          readBy: { userId: req.user.id, readAt: new Date() },
        },
      }
    );

    const io = getIO();
    group.members.forEach((memberId) => {
      if (memberId.toString() !== req.user.id) {
        io.to(`user_${memberId}`).emit("groupMessagesRead", {
          groupId,
          readerId: req.user.id,
        });
      }
    });

    successResponse(res, messages);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
export const getGroups = async (req, res) => {
  try {
    if (!req.user?.id || !req.workspaceId) {
      return errorResponse(res, "Invalid user or workspace", 400);
    }

    const groups = await GroupModel.find({
      workspace: req.workspaceId,
      members: req.user.id,
    })
      .populate({
        path: "members",
        select: "name email",
      })
      .populate({
        path: "creator",
        select: "name email",
      })
      .sort({ updatedAt: -1 });

    // Get unread count and last message for each group
    const groupsWithDetails = await Promise.all(
      groups.map(async (group) => {
        const unreadCount = await MessageModel.countDocuments({
          group: group._id,
          workspace: req.workspaceId,
          isGroupMessage: true,
          "readBy.userId": { $ne: req.user.id },
        });

        const lastMessage = await MessageModel.findOne({
          group: group._id,
          workspace: req.workspaceId,
          isGroupMessage: true,
        })
          .sort({ createdAt: -1 })
          .select("content createdAt sender")
          .populate("sender", "name email");

        return {
          _id: group._id,
          name: group.name,
          members: group.members,
          creator: group.creator,
          workspace: group.workspace,
          unreadCount,
          lastMessage,
        };
      })
    );

    successResponse(res, groupsWithDetails);
  } catch (error) {
    console.error("Get Groups Error:", error);
    errorResponse(res, error.message); // Send the actual error message for debugging
  }
};
export const addGroupMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.body;

    const group = await GroupModel.findOneAndUpdate(
      {
        _id: groupId,
        creator: req.user.id,
        workspace: req.workspaceId,
      },
      { $addToSet: { members: memberId } },
      { new: true }
    ).populate("members", "name email");

    if (!group) {
      return errorResponse(res, "Group not found or not authorized", 404);
    }

    const io = getIO();
    io.to(`user_${memberId}`).emit("addedToGroup", group);
    group.members.forEach((member) => {
      io.to(`user_${member._id}`).emit("groupUpdated", group);
    });

    successResponse(res, group);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await MessageModel.findOne({
      _id: messageId,
      sender: req.user.id,
      workspace: req.workspaceId,
    });

    if (!message) {
      return errorResponse(res, "Message not found or not authorized", 404);
    }

    await MessageModel.deleteOne({ _id: messageId });

    const io = getIO();
    if (message.isGroupMessage) {
      const group = await GroupModel.findById(message.group);
      group.members.forEach((memberId) => {
        io.to(`user_${memberId}`).emit("messageDeleted", {
          messageId,
          groupId: message.group,
        });
      });
    } else {
      io.to(`user_${message.receiver}`).emit("messageDeleted", { messageId });
      io.to(`user_${req.user.id}`).emit("messageDeleted", { messageId });
    }

    successResponse(res, { messageId });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await MessageModel.findOne({
      _id: messageId,
      sender: req.user.id,
      isGroupMessage: true,
      workspace: req.workspaceId,
    });

    if (!message) {
      return errorResponse(res, "Message not found or not authorized", 404);
    }

    const group = await GroupModel.findOne({
      _id: message.group,
      members: req.user.id,
    });

    if (!group) {
      return errorResponse(res, "Group not found or access denied", 404);
    }

    await MessageModel.deleteOne({ _id: messageId });

    const io = getIO();
    group.members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("groupMessageDeleted", {
        messageId,
        groupId: group._id,
      });
    });

    successResponse(res, { messageId });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await GroupModel.findOne({
      _id: groupId,
      creator: req.user.id,
      workspace: req.workspaceId,
    });
    if (!group) {
      return errorResponse(res, "Group not found or not authorized", 404);
    }

    await MessageModel.deleteMany({
      group: group._id,
      workspace: req.workspaceId,
    });

    const io = getIO();
    group.members.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("groupDeleted", {
        groupId: group._id,
      });
    });
    await GroupModel.deleteOne({ _id: group._id });
    successResponse(res, { message: "Group deleted successfully" });
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const viewGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await GroupModel.findOne({
      _id: groupId,
      workspace: req.workspaceId,
    });
    if (!group) {
      return errorResponse(res, "Group not found", 404);
    }
    //populate members
    const populatedGroup = await group.populate("members", "name email");
    successResponse(res, populatedGroup);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
