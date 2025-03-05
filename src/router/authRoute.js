import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

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
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    console.log("✅ Google Login Success:", req.user);

    // Kiểm tra nếu req.user bị undefined
    if (!req.user) {
      return res.status(401).json({ message: "Google login failed" });
    }

    
    // res.redirect("http://localhost:5173/dashboard");
    res.redirect("/api/v1/auth/profile");

  }
);

router.get("/profile", (req, res) => {
  console.log("🔍 Profile Session:", req.session);
  console.log("👤 Profile User:", req.user);

  // Ensure the user is actually authenticated
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({ user: req.user });
});

// router.get("/check-session", (req, res) => {
//   console.log("Session user:", req.user);
//   if (req.user) {
//     res.json({ user: req.user });
//   } else {
//     res.status(401).json({ message: "Session expired" });
//   }
// });

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((error) => {
      if (error) {
        console.error("❌ Error destroying session:", error);
        return res.status(500).json({ message: "Logout failed" });
      }

      console.log("✅ Session Destroyed Successfully");

      // Forcefully clear the session cookie
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: false, // Change to true if using HTTPS
        sameSite: "strict",
        maxAge: 0, // Expire the cookie immediately
      });

      console.log("🍪 Cookie Cleared");
      res.status(200).json({ message: "Logout successful" });
    });
  });
});

export default router;
