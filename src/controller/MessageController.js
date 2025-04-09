import MessageModel from "../model/MessageModel.js";
import GroupModel from "../model/GroupModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { getIO } from "../socket.js";
import UserModel from "../model/UserModel.js";
import NotificationModel from "../model/NotificationModel.js";
import cloudinary from "../config/cloudinary.js";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
});

const uploadToCloudinary = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "messages" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

const populateOptions = {
  path: "sender receiver",
  select: "name email",
};

export const sendMessage = async (req, res) => {
  try {
    upload.any()(req, res, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "File upload failed", details: err });
      }

      const { receiverId, content } = req.body;
      const files = req.files;

      const receiver = await UserModel.findById(receiverId);
      if (!receiver) {
        console.log(receiverId);
        return errorResponse(res, "Receiver not found", 404);
      }

      const attachments = [];

      if (files && files.length > 0) {
        try {
          const uploadPromises = files.map(async (file) => {
            const result = await uploadToCloudinary(
              file.buffer,
              file.originalname
            );
            return {
              filename: file.originalname,
              path: result.secure_url,
              mimetype: file.mimetype,
              public_id: result.public_id,
            };
          });

          const uploadedFiles = await Promise.all(uploadPromises);
          attachments.push(...uploadedFiles);
        } catch (error) {
          console.error("Error uploading files to Cloudinary:", error);
          return errorResponse(res, "Failed to upload files");
        }
      }

      console.log("Attachments:", attachments);
      const message = await MessageModel.create({
        sender: req.user.id,
        receiver: receiver._id,
        content,
        workspace: req.workspaceId,
        attachments: attachments,
      });

      const populatedMessage = await message.populate(populateOptions);

      const notification = await NotificationModel.create({
        workspace: req.workspaceId,
        userId: receiver._id,
        title: "New Message",
        message: `You have a new message from ${message.sender.name}`,
        link: `${process.env.FRONTEND_URL}/messages`,
      });
      const io = getIO();
      io.to(`user_${receiver._id}`).emit("newMessage", {
        message: populatedMessage,
        notification: notification,
      });

      successResponse(res, populatedMessage);
    });
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

    // Mark messages as read
    await MessageModel.updateMany(
      {
        receiver: req.user.id,
        sender: userId,
        isRead: false,
      },
      { isRead: true }
    );

    // Get updated conversation with unread count
    const unreadCount = await MessageModel.countDocuments({
      workspace: req.workspaceId,
      sender: userId,
      receiver: req.user.id,
      isRead: false,
    });

    const io = getIO();
    io.to(`user_${userId}`).emit("messagesRead", {
      reader: req.user.id,
      conversation: userId,
    });

    successResponse(res, { messages, unreadCount });
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

    // check members exists
    const membersExist = await UserModel.find({
      _id: { $in: members },
      "workspaces.workspace": req.workspaceId,
    });
    if (membersExist.length !== members.length) {
      console.log(membersExist);
      return errorResponse(res, "Members not found", 404);
    }

    const group = await GroupModel.create({
      name,
      members: [...members, req.user.id],
      workspace: req.workspaceId,
      creator: req.user.id,
    });

    const populatedGroup = await group.populate("members", "name email");

    //send notification to all members
    membersExist.forEach(async (member) => {
      if (member._id.toString() !== req.user.id.toString()) {
        const noti = await NotificationModel.create({
          workspace: req.workspaceId,
          userId: member._id,
          title: "New Group",
          message: `You have been added to the group ${group.name}`,
          link: `${process.env.FRONTEND_URL}/messages`,
        });

        io.to(`user_${member._id}`).emit("newGroupNoti", noti);
      }
    });

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
    upload.any()(req, res, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "File upload failed", details: err });
      }
      const { groupId, content } = req.body;
      const files = req.files;

      const group = await GroupModel.findOne({
        _id: groupId,
        members: req.user.id,
        workspace: req.workspaceId,
      });

      if (!group) {
        return errorResponse(res, "Group not found or access denied", 404);
      }

      const attachments = [];
      if (files && files.length > 0) {
        try {
          const uploadPromises = files.map(async (file) => {
            const result = await uploadToCloudinary(
              file.buffer,
              file.originalname
            );
            return {
              filename: file.originalname,
              path: result.secure_url,
              mimetype: file.mimetype,
              public_id: result.public_id,
            };
          });

          const uploadedFiles = await Promise.all(uploadPromises);
          attachments.push(...uploadedFiles);
        } catch (error) {
          console.error("Error uploading files to Cloudinary:", error);
          return errorResponse(res, "Failed to upload files");
        }
      }

      const message = await MessageModel.create({
        sender: req.user.id,
        group: groupId,
        content: content,
        workspace: req.workspaceId,
        isGroupMessage: true,
        attachments: attachments,
      });

      const populatedMessage = await message.populate([
        { path: "sender", select: "name email" },
        { path: "group", select: "name members" },
      ]);

      const io = getIO();
      group.members.forEach((memberId) => {
        if (memberId !== req.user.id) {
          io.to(`user_${memberId}`).emit("newGroupMessage", {
            groupId,
            message: populatedMessage,
          });
        }
      });

      successResponse(res, populatedMessage);
    });
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

    // Mark all unread messages as read for the current user only
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

    // Get updated unread count for the current user
    const unreadCount = await MessageModel.countDocuments({
      group: groupId,
      workspace: req.workspaceId,
      isGroupMessage: true,
      "readBy.userId": { $ne: req.user.id },
    });

    const io = getIO();
    group.members.forEach((memberId) => {
      if (memberId.toString() !== req.user.id.toString()) {
        io.to(`user_${memberId}`).emit("groupMessagesRead", {
          groupId,
          readerId: req.user.id,
        });
      }
    });

    successResponse(res, { messages, unreadCount });
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

    // Delete attachments from Cloudinary
    if (message.attachments && message.attachments.length > 0) {
      const deletePromises = message.attachments.map((attachment) =>
        cloudinary.uploader.destroy(attachment.public_id)
      );
      await Promise.all(deletePromises);
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

    // Delete attachments from Cloudinary
    if (message.attachments && message.attachments.length > 0) {
      const deletePromises = message.attachments.map((attachment) =>
        cloudinary.uploader.destroy(attachment.public_id)
      );
      await Promise.all(deletePromises);
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

export const getAttachmentsInMessage = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("user: ", userId);
    const isExist = await UserModel.findOne({
      _id: userId,
      "workspaces.workspace": req.workspaceId,
    });

    if (!isExist) {
      return errorResponse(res, "User not found", 404);
    }

    const messages = await MessageModel.find({
      receiver: userId,
      workspace: req.workspaceId,
    });
    const attachments = messages.reduce((acc, message) => {
      if (message.attachments && message.attachments.length > 0) {
        acc.push(...message.attachments);
      }
      return acc;
    }, []);
    successResponse(res, attachments);
  } catch (error) {
    errorResponse(res, error.message);
  }
};

export const getAttachmentsInGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const isExist = await GroupModel.findOne({
      _id: groupId,
      workspace: req.workspaceId,
    });
    if (!isExist) {
      return errorResponse(res, "Group not found", 404);
    }
    const messages = await MessageModel.find({
      group: groupId,
      workspace: req.workspaceId,
      isGroupMessage: true,
    }).populate("sender", "name email");
    const attachments = messages.reduce((acc, message) => {
      if (message.attachments && message.attachments.length > 0) {
        acc.push(...message.attachments);
      }
      return acc;
    }, []);
    successResponse(res, attachments);
  } catch (error) {
    errorResponse(res, error.message);
  }
};
