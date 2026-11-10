import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    isAnonymous: { type: Boolean, default: false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [
      {
        body: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
