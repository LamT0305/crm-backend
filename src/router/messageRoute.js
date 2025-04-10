import express from "express";
import { verifyToken } from "../middleware/authMiddleWare.js";
import { checkWorkspaceAccess } from "../middleware/workspaceAuth.js";
import {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead,
  createGroup,
  sendGroupMessage,
  getGroupMessages,
  getGroups,
  addGroupMember,
  deleteGroupMessage,
  deleteMessage,
  deleteGroup,
  viewGroupDetails,
  getAttachmentsInGroupMessage,
  getAttachmentsInMessage,
  removeGroupMember,
} from "../controller/MessageController.js";

const router = express.Router();

// Apply middleware
router.use(verifyToken);
router.use(checkWorkspaceAccess);

// Group messaging routes (must come before dynamic routes)
router.get("/list/groups", getGroups); // Changed from /groups to /list/groups
router.post("/group/new", createGroup);
router.post("/group/message", sendGroupMessage);
router.post("/group/:groupId/member", addGroupMember);
router.get("/group/:groupId/messages", getGroupMessages);
router.get("/group/details/:groupId", viewGroupDetails);
router.get("/group/:groupId/attachments", getAttachmentsInGroupMessage);
router.delete("/group/:groupId", deleteGroup);
router.delete("/group/message/:messageId", deleteGroupMessage);
router.delete("/group/:groupId/member/:userId", removeGroupMember);

// Direct messaging routes
router.post("/send", sendMessage);
router.get("/conversations", getConversations);
router.put("/message/read/:messageId", markAsRead);
router.delete("/message/:messageId", deleteMessage);

// This must come last as it has a dynamic parameter
router.get("/user/:userId", getMessages);
router.get("/user/:userId/attachments", getAttachmentsInMessage);

export default router;
