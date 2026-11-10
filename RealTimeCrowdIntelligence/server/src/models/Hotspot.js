import mongoose from 'mongoose';

const hotspotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    areaName: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    locality: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    reportCount: {
      type: Number,
      default: 0
    },
    avgDensity: {
      type: Number,
      default: 0
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    intensity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    categories: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'cooling', 'resolved'],
      default: 'active'
    }
  },
  { timestamps: true }
);

hotspotSchema.index({ location: '2dsphere' });
hotspotSchema.index({ status: 1, intensity: -1 });
hotspotSchema.index({ city: 1, locality: 1, intensity: -1 });

export const Hotspot = mongoose.model('Hotspot', hotspotSchema);
