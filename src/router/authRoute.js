import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middleware/authMiddleWare.js";

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

    // 🔥 Generate JWT Token
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Redirect user with JWT (frontend will handle storage)
    res.redirect(`http://localhost:5173/auth-success?token=${token}`);
  }
);

router.get("/profile", verifyToken, (req, res) => {
  res.json({ user: req.user }); // ✅ Return user info from JWT
});

export default router;
