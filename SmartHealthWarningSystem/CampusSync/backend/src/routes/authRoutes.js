import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!email.endsWith(".edu") && !email.includes("@geu.ac.in")) {
      return res.status(400).json({ message: "Use an institutional email" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: "student" });
    res.status(201).json({ message: "Registered successfully", userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, skills: user.skills }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

router.put("/skills", protect, async (req, res) => {
  try {
    const skills = Array.isArray(req.body.skills) ? req.body.skills : [];
    req.user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    await req.user.save();
    res.json({ message: "Skills updated", skills: req.user.skills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
