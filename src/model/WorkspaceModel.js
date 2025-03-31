import mongoose from "mongoose";

const WorkspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["Admin", "Member"], default: "Member" },
        status: {
          type: String,
          enum: ["Pending", "Active"],
          default: "Pending",
        },
      },
    ],
    invitations: [
      {
        email: { type: String },
        token: { type: String },
        expiresAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

const WorkspaceModel = mongoose.model("Workspace", WorkspaceSchema);
export default WorkspaceModel;
