import mongoose from 'mongoose';

const intelligenceSnapshotSchema = new mongoose.Schema(
  {
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    operationalRisk: {
      score: {
        type: Number,
        default: 0
      },
      level: {
        type: String,
        enum: ['low', 'moderate', 'high', 'critical'],
        default: 'low'
      }
    },
    riskOverview: {
      averageRisk: Number,
      highestRisk: Number,
      criticalReports: Number,
      highRiskReports: Number
    },
    trends: {
      hourly: Array,
      daily: Array,
      weekly: Array,
      categoryGrowth: Array,
      summaries: [String]
    },
    summary: {
      type: String,
      default: ''
    },
    recommendations: [
      {
        priority: String,
        action: String,
        reason: String
      }
    ],
    hotspotIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotspot'
      }
    ],
    anomalyIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Anomaly'
      }
    ],
    forecastId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Forecast'
    }
  },
  { timestamps: true }
);

intelligenceSnapshotSchema.index({ createdAt: -1 });
intelligenceSnapshotSchema.index({ 'operationalRisk.level': 1, createdAt: -1 });

export const IntelligenceSnapshot = mongoose.model('IntelligenceSnapshot', intelligenceSnapshotSchema);
