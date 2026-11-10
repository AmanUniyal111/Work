import { Report } from '../models/Report.js';
import { evaluateAlertsForReport } from '../services/alertService.js';
import { enrichReportIntelligence, recomputeOperationalIntelligence } from '../services/intelligenceService.js';
import { emitAnalyticsUpdated, emitIntelligenceUpdated, emitReportCreated } from '../sockets/io.js';
import { getAnalyticsSnapshot } from './analyticsController.js';

export async function createReport(req, res, next) {
  try {
    const { title, description, category, severity, address, latitude, longitude, densityScore } = req.body;

    const report = await Report.create({
      title,
      description,
      category,
      severity,
      address,
      densityScore,
      createdBy: req.user._id,
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      }
    });

    await enrichReportIntelligence(report);

    const populated = await report.populate('createdBy', 'name email role');
    emitReportCreated(populated);

    const alert = await evaluateAlertsForReport(report);
    const intelligence = await recomputeOperationalIntelligence({ sourceReport: report });
    const analytics = await getAnalyticsSnapshot();
    emitAnalyticsUpdated({ analytics, alert });
    emitIntelligenceUpdated(intelligence);

    res.status(201).json({ report: populated, alert, intelligence });
  } catch (error) {
    next(error);
  }
}

export async function listReports(req, res, next) {
  try {
    const { category, severity, status, limit = 50 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 200));

    res.json({ reports });
  } catch (error) {
    next(error);
  }
}

export async function updateReportStatus(req, res, next) {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    if (!report) return res.status(404).json({ message: 'Report not found.' });

    const intelligence = await recomputeOperationalIntelligence({ sourceReport: report });
    const analytics = await getAnalyticsSnapshot();
    emitAnalyticsUpdated({ analytics });
    emitIntelligenceUpdated(intelligence);
    res.json({ report });
  } catch (error) {
    next(error);
  }
}
