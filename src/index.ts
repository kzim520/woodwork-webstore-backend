import express, { Request, Response } from "express";
import cors from "cors";
import { pool } from "./db"; 
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3001;

// Dynamically determine upload path: local or production
const uploadPath = process.env.UPLOADS_DIR || path.join(__dirname, "../uploads");

// Create uploads folder if missing (only in local dev)
if (!process.env.UPLOADS_DIR && !fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log(`📁 Created local uploads directory at ${uploadPath}`);
}

// Set up Multer storage
const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Create Multer instance
const upload = multer({ storage });

// Middleware setup
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadPath));

// Test route
app.get("/api/hello", (_req: Request, res: Response) => {
  res.json({ message: "Hello from the backend!" });
});

// Route to handle custom orders with file uploads
app.post(
  "/api/custom-order",
  upload.array("images", 5), // Accept up to 5 images
  async (req: Request, res: Response) => {
    try {
      const { name, email, phone, projectDescription } = req.body;

      const imagePaths = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );

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
    } catch (err) {
      console.error("❌ Upload or DB error:", err);
      res.status(500).json({ message: "Something went wrong." });
    }
  }
);

// Health check route for /api/custom-order
app.get("/api/custom-order", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Custom order endpoint is healthy." });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});
