import { Router } from 'express';
import { createReport, listReports, updateReportStatus } from '../controllers/reportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const reportRoutes = Router();

reportRoutes.use(authenticate);
reportRoutes.get('/', listReports);
reportRoutes.post('/', createReport);
reportRoutes.patch('/:id/status', authorize('admin'), updateReportStatus);
