import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import qaRoutes from "./routes/qaRoutes.js";
import squadRoutes from "./routes/squadRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);
app.use(express.json());

app.get("/api/health", (_, res) => {
  res.json({ ok: true, message: "CampusSync backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/qa", qaRoutes);
app.use("/api/squad", squadRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const connectAndStart = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed. Check MONGO_URI.", error.message);
    process.exit(1);
  }
};

connectAndStart();
