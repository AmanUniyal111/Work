import express from "express";
import Event from "../models/Event.js";
import Notification from "../models/Notification.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const category = req.query.category?.trim();
  const filter = category ? { category: { $regex: `^${category}$`, $options: "i" } } : {};
  const events = await Event.find(filter).sort({ date: 1 });
  const mapped = events.map((e) => ({
    ...e.toObject(),
    availableSeats: e.totalSeats - e.registeredUsers.length
  }));
  res.json(mapped);
});

router.post("/", protect, authorize("mentor", "admin"), async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(event);
});

router.post("/:id/register", protect, async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });

  const alreadyRegistered = event.registeredUsers.some((userId) => userId.equals(req.user._id));
  if (alreadyRegistered) {
    return res.json({ message: "You are already registered for this event" });
  }

  if (event.registeredUsers.length >= event.totalSeats) {
    return res.status(400).json({ message: "No seats available" });
  }

  event.registeredUsers.push(req.user._id);
  await event.save();

  await Notification.create({
    user: req.user._id,
    title: "Event registered",
    message: `You are registered for "${event.title}".`
  });

  res.json({ message: "Registered successfully" });
});

export default router;
