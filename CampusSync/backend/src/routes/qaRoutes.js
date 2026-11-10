import express from "express";
import Question from "../models/Question.js";
import { protect, authorize } from "../middleware/auth.js";
import Notification from "../models/Notification.js";

const router = express.Router();

/** Strip author identity from API responses (names are not exposed). */
function sanitizeQuestion(q) {
  return {
    _id: q._id,
    title: q.title,
    body: q.body,
    isAnonymous: true,
    answers: (q.answers || []).map((a) => ({
      _id: a._id,
      body: a.body,
      createdAt: a.createdAt
    })),
    createdAt: q.createdAt,
    updatedAt: q.updatedAt
  };
}

router.get("/", protect, async (req, res) => {
  const q = req.query.q?.trim();
  const filter = q
    ? { $or: [{ title: { $regex: q, $options: "i" } }, { body: { $regex: q, $options: "i" } }] }
    : {};
  const questions = await Question.find(filter).sort({ createdAt: -1 }).lean();
  res.json(questions.map(sanitizeQuestion));
});

router.post("/", protect, async (req, res) => {
  const { title, body } = req.body;
  const question = await Question.create({
    title,
    body,
    isAnonymous: true,
    author: req.user._id
  });
  res.status(201).json(sanitizeQuestion(question.toObject()));
});

router.post("/:id/answer", protect, authorize("mentor", "admin"), async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  if (!req.body.body || req.body.body.trim() === "") {
    return res.status(400).json({ message: "Answer cannot be empty" });
  }

  question.answers.push({
    body: req.body.body,
    author: req.user._id
  });

  await question.save();

  await Notification.create({
    user: question.author,
    title: "New answer received",
    message: `Your question "${question.title}" got a new response.`
  });

  res.json({ message: "Answer posted" });
});

export default router;
