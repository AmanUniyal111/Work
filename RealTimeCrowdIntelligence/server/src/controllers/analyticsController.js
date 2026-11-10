import { Alert } from '../models/Alert.js';
import { Report } from '../models/Report.js';

export async function getAnalyticsSnapshot() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [overview] = await Report.aggregate([
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalReports: { $sum: 1 },
              avgDensity: { $avg: '$densityScore' },
              openReports: {
                $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
              },
              criticalReports: {
                $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
              },
              avgRisk: {
                $avg: '$riskScore'
              },
              highestRisk: {
                $max: '$riskScore'
              }
            }
          }
        ],
        last24Hours: [
          { $match: { createdAt: { $gte: since24h } } },
          {
            $group: {
              _id: null,
              reports: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);

  const byCategory = await Report.aggregate([
    { $match: { createdAt: { $gte: since7d } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' },
        highSeverity: {
          $sum: { $cond: [{ $in: ['$severity', ['high', 'critical']] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const timeline = await Report.aggregate([
    { $match: { createdAt: { $gte: since7d } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        reports: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const heatmap = await Report.aggregate([
    { $match: { createdAt: { $gte: since7d }, status: { $ne: 'resolved' } } },
    {
      $project: {
        lat: { $arrayElemAt: ['$location.coordinates', 1] },
        lng: { $arrayElemAt: ['$location.coordinates', 0] },
        intensity: '$densityScore',
        category: 1,
        severity: 1,
        title: 1,
        riskScore: 1,
        riskLevel: 1,
        areaName: '$geo.areaName',
        city: '$geo.city',
        locality: '$geo.locality'
      }
    },
    { $limit: 500 }
  ]);

  const trendingIssues = await Report.aggregate([
    { $match: { createdAt: { $gte: since24h } } },
    {
      $group: {
        _id: {
          category: '$category',
          severity: '$severity'
        },
        count: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' }
      }
    },
    {
      $project: {
        _id: 0,
        category: '$_id.category',
        severity: '$_id.severity',
        count: 1,
        avgDensity: { $round: ['$avgDensity', 1] },
        trendScore: {
          $add: [
            '$count',
            { $multiply: ['$avgDensity', 0.4] },
            {
              $cond: [{ $in: ['$_id.severity', ['high', 'critical']] }, 3, 0]
            }
          ]
        }
      }
    },
    { $sort: { trendScore: -1 } },
    { $limit: 8 }
  ]);

  const activeAlerts = await Alert.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10);

  const totals = overview?.totals?.[0] || {};
  const last24Hours = overview?.last24Hours?.[0]?.reports || 0;

  return {
    summary: {
      totalReports: totals.totalReports || 0,
      openReports: totals.openReports || 0,
      criticalReports: totals.criticalReports || 0,
      avgDensity: Number((totals.avgDensity || 0).toFixed(1)),
      avgRisk: Number((totals.avgRisk || 0).toFixed(1)),
      highestRisk: totals.highestRisk || 0,
      last24Hours,
      activeAlerts: activeAlerts.length
    },
    byCategory: byCategory.map((item) => ({
      category: item._id,
      count: item.count,
      avgDensity: Number(item.avgDensity.toFixed(1)),
      highSeverity: item.highSeverity
    })),
    timeline: timeline.map((item) => ({
      date: item._id,
      reports: item.reports,
      avgDensity: Number(item.avgDensity.toFixed(1))
    })),
    trendingIssues,
    heatmap,
    activeAlerts
  };
}

export async function analyticsOverview(req, res, next) {
  try {
    res.json({ analytics: await getAnalyticsSnapshot() });
  } catch (error) {
    next(error);
  }
}
