import mongoose from 'mongoose';

const forecastSchema = new mongoose.Schema(
  {
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    currentDensity: {
      type: Number,
      default: 0
    },
    predictions: {
      nextHour: {
        type: Number,
        default: 0
      },
      next6Hours: {
        type: Number,
        default: 0
      },
      next24Hours: {
        type: Number,
        default: 0
      }
    },
    series: [
      {
        label: String,
        density: Number
      }
    ],
    method: {
      type: String,
      default: 'weighted_moving_average'
    }
  },
  { timestamps: true }
);

forecastSchema.index({ createdAt: -1 });

export const Forecast = mongoose.model('Forecast', forecastSchema);
