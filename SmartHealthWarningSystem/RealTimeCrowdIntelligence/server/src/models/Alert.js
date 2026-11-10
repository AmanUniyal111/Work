import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high'
    },
    threshold: {
      type: Number,
      required: true
    },
    count: {
      type: Number,
      required: true
    },
    windowMinutes: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: undefined
      }
    }
  },
  { timestamps: true }
);

alertSchema.index({ category: 1, status: 1, createdAt: -1 });

export const Alert = mongoose.model('Alert', alertSchema);
