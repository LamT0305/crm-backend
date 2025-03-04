import jsonwebtoken from "jsonwebtoken";
const authMiddleWare = (req, res, next) => {
  if (req.user) {
    console.log("User authenticated via Google:", req.user);
    return next();
  }

  const token = req.header("Authorization")?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access denied, token missing!" });
  }

  try {
    const verified = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token!" });
  }
};

export default authMiddleWare;

export const restoreUser = async (req, res, next) => {
  if (!req.user && req.session.passport?.user) {
    try {
      const user = await UserModel.findById(req.session.passport.user);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error("❌ Error restoring user:", error);
    }
  }

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
};
