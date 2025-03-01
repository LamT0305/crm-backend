import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = express.Router();

// Route to start Google authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Send token to frontend (in a real app, use a cookie instead)
    res.json({ token, user: req.user });
  }
);

export default router;
