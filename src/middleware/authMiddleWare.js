import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No Token Provided." });
  }

  try {
    const verified = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    req.user = verified; // Attach user data to request
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid Token" });
  }
};



