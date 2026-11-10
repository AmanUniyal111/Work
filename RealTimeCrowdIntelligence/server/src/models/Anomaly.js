import mongoose from 'mongoose';

const anomalySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['density_spike', 'frequency_spike', 'category_surge'],
      required: true
    },
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
      default: ''
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'high'
    },
    baseline: {
      type: Number,
      default: 0
    },
    observed: {
      type: Number,
      default: 0
    },
    percentChange: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active'
    },
    sourceReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report'
    }
  },
  { timestamps: true }
);

anomalySchema.index({ type: 1, category: 1, status: 1, createdAt: -1 });
anomalySchema.index({ createdAt: -1 });

export const Anomaly = mongoose.model('Anomaly', anomalySchema);
