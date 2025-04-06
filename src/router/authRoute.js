import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/authMiddleWare.js";
import UserModel from "../model/UserModel.js";

const router = express.Router();

// Route to start Google authentication
router.get(
  "/google",
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

// Google OAuth Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Google login failed" });
    }

    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
  }
);

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select(
      "-password -accessToken -refreshToken"
    );
    // .populate("workspace", "name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: user });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
  // ✅ Return user info from JWT
});

export default router;
