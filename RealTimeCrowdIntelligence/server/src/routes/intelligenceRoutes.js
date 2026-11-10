import { Router } from 'express';
import { intelligenceOverview, refreshIntelligence } from '../controllers/intelligenceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const intelligenceRoutes = Router();

intelligenceRoutes.get('/overview', authenticate, intelligenceOverview);
intelligenceRoutes.post('/refresh', authenticate, authorize('admin'), refreshIntelligence);
