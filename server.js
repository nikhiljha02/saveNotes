import express from "express";
import authRoute from "./Routes/route.js";
import notesRoute from "./Routes/noteRoute.js";
import connectDB from "./database/db.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import cookieParser from "cookie-parser";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Health check: no database connection required
app.get("/api/health", (req, res) => {
  res.json({ message: "API is working!" });
});

// Connect to MongoDB before database-dependent routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failed:", err.message);
    res.status(503).json({
      message: "Database temporarily unavailable",
    });
  }
});

// API routes
app.use("/auth", authRoute);
app.use("/note", notesRoute);

// Export app for Vercel
export default app;

// Local development
if (process.env.VERCEL !== "1") {
  const port = process.env.PORT || 8080;

  connectDB()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    })
    .catch((err) => {
      console.error("Database connection failed:", err.message);
      process.exitCode = 1;
    });
}
