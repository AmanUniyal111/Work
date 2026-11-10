import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    totalSeats: { type: Number, required: true, min: 1 },
    registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

eventSchema.virtual("availableSeats").get(function getAvailableSeats() {
  return this.totalSeats - this.registeredUsers.length;
});

export default mongoose.model("Event", eventSchema);
