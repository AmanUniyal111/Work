import { Router } from 'express';
import { analyticsOverview } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

export const analyticsRoutes = Router();

analyticsRoutes.get('/overview', authenticate, analyticsOverview);
