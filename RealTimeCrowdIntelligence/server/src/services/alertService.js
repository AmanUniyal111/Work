import { env } from '../config/env.js';
import { Alert } from '../models/Alert.js';
import { Report } from '../models/Report.js';
import { emitAlertCreated } from '../sockets/io.js';

export async function evaluateAlertsForReport(report) {
  const since = new Date(Date.now() - env.alertWindowMinutes * 60 * 1000);

  const [bucket] = await Report.aggregate([
    {
      $match: {
        category: report.category,
        createdAt: { $gte: since },
        status: { $ne: 'resolved' }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' },
        criticalCount: {
          $sum: {
            $cond: [{ $in: ['$severity', ['high', 'critical']] }, 1, 0]
          }
        }
      }
    }
  ]);

  if (!bucket || bucket.count < env.alertThreshold) return null;

  const duplicate = await Alert.findOne({
    category: report.category,
    status: 'active',
    createdAt: { $gte: since }
  });

  if (duplicate) return duplicate;

  const alert = await Alert.create({
    title: `${report.category} threshold crossed`,
    message: `${bucket.count} ${report.category} reports were submitted in the last ${env.alertWindowMinutes} minutes.`,
    category: report.category,
    severity: bucket.criticalCount > 0 || bucket.avgDensity >= 7 ? 'critical' : 'high',
    threshold: env.alertThreshold,
    count: bucket.count,
    windowMinutes: env.alertWindowMinutes,
    location: report.location
  });

  emitAlertCreated(alert);
  return alert;
}
