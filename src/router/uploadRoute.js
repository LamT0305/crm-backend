import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Configure Multer Storage with Cloudinary for all file types
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "crm_uploads"; // Default folder

    // Set resource type dynamically based on file mimetype
    if (file.mimetype.startsWith("image")) {
      return { folder, resource_type: "image" };
    } else if (file.mimetype.startsWith("video")) {
      return { folder, resource_type: "video" };
    } else {
      return { folder, resource_type: "raw" }; // For PDFs, docs, zip, etc.
    }
  },
});

const upload = multer({ storage });

// Route to upload files
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.status(200).json({
    success: true,
    url: req.file.path, // Cloudinary URL
    type: req.file.mimetype, // File type
  });
});

export default router;
