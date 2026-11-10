import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(value) {
          return value.length === 2;
        },
        message: 'Coordinates must include longitude and latitude.'
      }
    }
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    category: {
      type: String,
      enum: ['crowd', 'traffic', 'safety', 'medical', 'infrastructure', 'weather', 'other'],
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'monitoring', 'resolved'],
      default: 'open'
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: pointSchema,
      required: true,
      index: '2dsphere'
    },
    densityScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    riskLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'critical'],
      default: 'low'
    },
    intelligence: {
      nearbyReports: {
        type: Number,
        default: 0
      },
      recentFrequency: {
        type: Number,
        default: 0
      },
      categoryWeight: {
        type: Number,
        default: 0
      }
    },
    geo: {
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
      }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

reportSchema.index({ category: 1, createdAt: -1 });
reportSchema.index({ severity: 1, createdAt: -1 });
reportSchema.index({ riskLevel: 1, riskScore: -1 });
reportSchema.index({ 'geo.city': 1, 'geo.locality': 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
