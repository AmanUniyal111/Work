import express from "express";
import Team from "../models/Team.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/students", protect, async (req, res) => {
  const skill = req.query.skill?.trim();
  const filter = skill ? { skills: { $regex: `^${skill}$`, $options: "i" } } : {};
  const users = await User.find(filter).select("name email role skills");
  res.json(users);
});

router.post("/teams", protect, async (req, res) => {
  const { name, description, requiredSkills = [] } = req.body;
  const team = await Team.create({
    name,
    description,
    requiredSkills,
    owner: req.user._id,
    members: [req.user._id]
  });
  res.status(201).json(team);
});

router.get("/teams", protect, async (_req, res) => {
  const teams = await Team.find().populate("owner", "name").sort({ createdAt: -1 });
  res.json(teams);
});

router.post("/teams/:id/join", protect, async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ message: "Team not found" });
  const alreadyMember = team.members.some((memberId) => memberId.equals(req.user._id));
  if (!alreadyMember) team.members.push(req.user._id);
  await team.save();
  res.json({ message: "Joined team" });
});

export default router;
