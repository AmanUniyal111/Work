import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEOUT'].includes(error.code)) {
      console.error(
        [
          'MongoDB connection failed: the configured host could not be reached.',
          'Check server/.env MONGODB_URI. For Atlas, use the current connection string from your cluster and make sure your network/IP is allowed.',
          'For local development, start MongoDB locally and use MONGODB_URI=mongodb://127.0.0.1:27017/crowd-intelligence.'
        ].join('\n')
      );
    }
    throw error;
  }
}
