import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFile = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envFile });

const defaultClientOrigins = ['http://localhost:5173', 'http://localhost:5174'];
const configuredOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const clientOrigins = [...new Set([...configuredOrigins, ...defaultClientOrigins])];
const devOriginPatterns = [
  /^https?:\/\/localhost(?::\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
  /^https?:\/\/\[::1\](?::\d+)?$/,
  /^https?:\/\/10(?:\.\d{1,3}){3}(?::\d+)?$/,
  /^https?:\/\/192\.168(?:\.\d{1,3}){2}(?::\d+)?$/,
  /^https?:\/\/172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}(?::\d+)?$/
];

export function isAllowedClientOrigin(origin) {
  if (!origin) return true;
  if (clientOrigins.includes(origin)) return true;
  if (process.env.NODE_ENV !== 'production') {
    return devOriginPatterns.some((pattern) => pattern.test(origin));
  }
  return false;
}

export function corsOrigin(origin, callback) {
  callback(null, isAllowedClientOrigin(origin));
}

export const env = {
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crowd-intelligence',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || defaultClientOrigins[0],
  clientOrigins,
  alertWindowMinutes: Number(process.env.ALERT_WINDOW_MINUTES || 30),
  alertThreshold: Number(process.env.ALERT_THRESHOLD || 5)
};

console.log('Environment loaded from:', envFile);
console.log('process.env.CLIENT_ORIGIN:', process.env.CLIENT_ORIGIN || '(not set)');
console.log('env.clientOrigin:', env.clientOrigin);
console.log('env.clientOrigins:', env.clientOrigins.join(', '));
