import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String },
    password: { type: String }, // Optional for Google login
    userName: { type: String, unique: true, required: true },
    gender: { type: String },
    birthday: { type: Date },
    bio: { type: String },
    avatar: { type: String },
    refreshToken: { type: String },
    accessToken: { type: String },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    hasCompletedOnboarding: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
