import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String },
    password: { type: String },
    userName: { type: String, unique: true, required: true },
    gender: { type: String },
    birthday: { type: Date },
    bio: { type: String },
    avatar: { type: String },
    refreshToken: { type: String },
    accessToken: { type: String },
    workspaces: [
      {
        workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
        isOwner: { type: Boolean, default: false },
      },
    ],
    currentWorkspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
    },
    hasCompletedOnboarding: { type: Boolean, default: false },
    lastHistoryId: { type: String },
  },
  { timestamps: true }
);
const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
