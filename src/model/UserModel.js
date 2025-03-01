import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  userName: { type: String, unique: true, required: true },
  gender: { type: String, required: true },
  birthday: { type: String },
  bio: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
