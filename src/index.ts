import express, { Request, Response } from "express";
import cors from "cors";
import { pool } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3001;

// Determine the upload directory:
// - Use UPLOADS_DIR if provided (e.g., in production like Render)
// - Otherwise, default to a local directory at "../uploads"
const uploadPath = process.env.UPLOADS_DIR || path.join(__dirname, "../uploads");

// Create the uploads directory if it doesn't exist (only in local dev)
if (!process.env.UPLOADS_DIR && !fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log(`📁 Created local uploads directory at ${uploadPath}`);
}

// Set up Multer to handle file uploads:
// - Files will be stored in `uploadPath`
// - Filenames are made unique with a timestamp and random number
const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Create a Multer upload instance with an 8MB file size limit per image
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// === Middleware ===
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON requests
app.use("/uploads", express.static(uploadPath)); // Serve uploaded files statically

// === Routes ===

/**
 * POST /api/custom-order
 * Handles form submission with optional image uploads.
 * Saves the form data and uploaded image paths to the PostgreSQL database.
 */
app.post(
  "/api/custom-order",
  upload.array("images", 5), // Accept up to 5 images
  async (req: Request, res: Response) => {
    try {
      const { name, email, phone, projectDescription } = req.body;

      // Get uploaded file paths
      const imagePaths = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );

      // Insert the order into the database
      const result = await pool.query(
        `
        INSERT INTO custom_orders
        (name, email, phone, project_description, image_paths)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        `,
        [name, email, phone, projectDescription, imagePaths]
      );

      console.log("✅ Order saved with images:", imagePaths);

      res.status(200).json({
        status: "success",
        message: "Order received and stored.",
        orderId: result.rows[0].id,
        imagePaths: imagePaths,
      });
    } catch (err: any) {
      // Handle image size error
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "One or more images exceed the 5MB limit." });
        return;
      }

      // Generic error fallback
      console.error("❌ Upload or DB error:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

/**
 * GET /api/hello
 * Simple test route to confirm the backend is responsive.
 */
app.get("/api/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello from the backend!" });
});

/**
 * GET /api/custom-order
 * Health check for the custom order endpoint (no DB interaction).
 */
app.get("/api/custom-order", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Custom order endpoint is healthy." });
});

// === Server Startup ===
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});
