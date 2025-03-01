import jsonwebtoken from "jsonwebtoken";
const authMiddleWare = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access denied, token missing!" });
  }

  try {
    const verified = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Save the decoded token payload to the request object
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token!" });
  }
};

export default authMiddleWare;
