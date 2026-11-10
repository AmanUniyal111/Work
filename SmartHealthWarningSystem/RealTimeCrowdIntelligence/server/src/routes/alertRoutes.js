import { Router } from 'express';
import { listAlerts, updateAlertStatus } from '../controllers/alertController.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const alertRoutes = Router();

alertRoutes.get('/', authenticate, listAlerts);
alertRoutes.patch('/:id/status', authenticate, authorize('admin'), updateAlertStatus);
