import express from "express";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
});

router.post("/broadcast", protect, authorize("admin"), async (req, res) => {
  const users = await User.find().select("_id");
  const docs = users.map((u) => ({
    user: u._id,
    title: req.body.title || "Campus announcement",
    message: req.body.message || ""
  }));
  await Notification.insertMany(docs);
  res.json({ message: `Broadcasted to ${users.length} users` });
});

router.patch("/:id/read", protect, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ message: "Notification marked as read" });
});

export default router;
