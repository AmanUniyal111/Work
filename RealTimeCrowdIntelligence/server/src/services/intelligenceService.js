import { Alert } from '../models/Alert.js';
import { Anomaly } from '../models/Anomaly.js';
import { Forecast } from '../models/Forecast.js';
import { Hotspot } from '../models/Hotspot.js';
import { IntelligenceSnapshot } from '../models/IntelligenceSnapshot.js';
import { Report } from '../models/Report.js';

const severityWeights = {
  low: 4,
  medium: 12,
  high: 22,
  critical: 32
};

const categoryWeights = {
  crowd: 12,
  traffic: 8,
  safety: 16,
  medical: 18,
  infrastructure: 7,
  weather: 6,
  other: 4
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function round(value, digits = 1) {
  return Number((Number(value) || 0).toFixed(digits));
}

function riskLevelFromScore(score) {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return round(((current - previous) / previous) * 100);
}

function reverseGeocode({ address = '', latitude, longitude }) {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const locality = parts[0] || `Zone ${round(latitude, 2)}, ${round(longitude, 2)}`;
  const city = parts[parts.length - 1] || 'Unclassified City';
  const areaName = parts.slice(0, 2).join(', ') || locality;

  return { areaName, city, locality };
}

async function countNearbyReports(report, since) {
  const [result] = await Report.aggregate([
    {
      $geoNear: {
        near: report.location,
        distanceField: 'distance',
        maxDistance: 1000,
        spherical: true,
        query: {
          _id: { $ne: report._id },
          createdAt: { $gte: since },
          status: { $ne: 'resolved' }
        }
      }
    },
    { $count: 'count' }
  ]);

  return result?.count || 0;
}

async function calculateRiskForReport(report) {
  const since6h = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const since1h = new Date(Date.now() - 60 * 60 * 1000);
  const density = Number(report.densityScore || 0);
  const nearbyReports = await countNearbyReports(report, since6h);
  const recentFrequency = await Report.countDocuments({
    _id: { $ne: report._id },
    category: report.category,
    createdAt: { $gte: since1h },
    status: { $ne: 'resolved' }
  });
  const categoryWeight = categoryWeights[report.category] || categoryWeights.other;

  const score = clamp(
    density * 4 +
      (severityWeights[report.severity] || 0) +
      Math.min(nearbyReports * 5, 20) +
      Math.min(recentFrequency * 4, 20) +
      categoryWeight
  );

  return {
    riskScore: Math.round(score),
    riskLevel: riskLevelFromScore(score),
    intelligence: {
      nearbyReports,
      recentFrequency,
      categoryWeight
    }
  };
}

export async function enrichReportIntelligence(report) {
  const [longitude, latitude] = report.location.coordinates;
  const risk = await calculateRiskForReport(report);
  const geo = reverseGeocode({ address: report.address, latitude, longitude });

  report.riskScore = risk.riskScore;
  report.riskLevel = risk.riskLevel;
  report.intelligence = risk.intelligence;
  report.geo = geo;

  await report.save();
  return report;
}

async function refreshRecentRiskScores(limit = 80) {
  const since = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const reports = await Report.find({ createdAt: { $gte: since }, status: { $ne: 'resolved' } })
    .sort({ createdAt: -1 })
    .limit(limit);

  for (const report of reports) {
    await enrichReportIntelligence(report);
  }
}

async function computeHotspots() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const clusters = await Report.aggregate([
    { $match: { createdAt: { $gte: since24h }, status: { $ne: 'resolved' } } },
    {
      $project: {
        title: 1,
        address: 1,
        category: 1,
        densityScore: 1,
        riskScore: 1,
        geo: 1,
        lng: { $arrayElemAt: ['$location.coordinates', 0] },
        lat: { $arrayElemAt: ['$location.coordinates', 1] },
        gridLng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 2] },
        gridLat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 2] }
      }
    },
    {
      $group: {
        _id: { lat: '$gridLat', lng: '$gridLng' },
        reportCount: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' },
        maxRisk: { $max: '$riskScore' },
        avgRisk: { $avg: '$riskScore' },
        categories: { $addToSet: '$category' },
        areaName: { $first: '$geo.areaName' },
        city: { $first: '$geo.city' },
        locality: { $first: '$geo.locality' },
        sampleAddress: { $first: '$address' },
        lat: { $avg: '$lat' },
        lng: { $avg: '$lng' }
      }
    },
    {
      $project: {
        reportCount: 1,
        avgDensity: { $round: ['$avgDensity', 1] },
        riskScore: { $round: [{ $max: ['$avgRisk', '$maxRisk'] }, 0] },
        intensity: {
          $min: [
            100,
            {
              $add: [
                { $multiply: ['$avgDensity', 6] },
                { $multiply: ['$reportCount', 8] },
                { $multiply: ['$maxRisk', 0.35] }
              ]
            }
          ]
        },
        categories: 1,
        areaName: 1,
        city: 1,
        locality: 1,
        sampleAddress: 1,
        lat: 1,
        lng: 1
      }
    },
    { $match: { reportCount: { $gte: 2 } } },
    { $sort: { intensity: -1, riskScore: -1 } },
    { $limit: 10 }
  ]);

  await Hotspot.deleteMany({ status: 'active' });

  if (!clusters.length) return [];

  return Hotspot.insertMany(
    clusters.map((cluster) => ({
      name: cluster.areaName || cluster.sampleAddress || `Hotspot ${round(cluster.lat, 2)}, ${round(cluster.lng, 2)}`,
      areaName: cluster.areaName || '',
      city: cluster.city || '',
      locality: cluster.locality || '',
      location: {
        type: 'Point',
        coordinates: [cluster.lng, cluster.lat]
      },
      reportCount: cluster.reportCount,
      avgDensity: cluster.avgDensity,
      riskScore: clamp(cluster.riskScore),
      intensity: clamp(cluster.intensity),
      categories: cluster.categories,
      status: 'active'
    }))
  );
}

async function computeTrendIntelligence() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayTotals] = await Report.aggregate([
    { $match: { createdAt: { $gte: todayStart } } },
    {
      $group: {
        _id: null,
        reports: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' },
        highestDensity: { $max: '$densityScore' }
      }
    }
  ]);

  const [yesterdayTotals] = await Report.aggregate([
    { $match: { createdAt: { $gte: yesterdayStart, $lt: todayStart } } },
    {
      $group: {
        _id: null,
        reports: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' }
      }
    }
  ]);

  const hourly = await Report.aggregate([
    { $match: { createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%H:00', date: '$createdAt' } },
        reports: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const daily = await Report.aggregate([
    { $match: { createdAt: { $gte: last7d } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        reports: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const categoryWindows = await Report.aggregate([
    { $match: { createdAt: { $gte: yesterdayStart } } },
    {
      $project: {
        category: 1,
        window: {
          $cond: [{ $gte: ['$createdAt', todayStart] }, 'today', 'yesterday']
        }
      }
    },
    {
      $group: {
        _id: { category: '$category', window: '$window' },
        count: { $sum: 1 }
      }
    }
  ]);

  const growthByCategory = new Map();
  for (const item of categoryWindows) {
    const category = item._id.category;
    const current = growthByCategory.get(category) || { category, today: 0, yesterday: 0, growth: 0 };
    current[item._id.window] = item.count;
    growthByCategory.set(category, current);
  }

  const categoryGrowth = [...growthByCategory.values()]
    .map((item) => ({
      ...item,
      growth: percentChange(item.today, item.yesterday)
    }))
    .sort((a, b) => b.growth - a.growth);

  const summaries = [];
  const densityGrowth = percentChange(todayTotals?.avgDensity || 0, yesterdayTotals?.avgDensity || 0);
  const reportGrowth = percentChange(todayTotals?.reports || 0, yesterdayTotals?.reports || 0);

  if (reportGrowth) summaries.push(`Report volume changed ${reportGrowth}% compared to yesterday.`);
  if (densityGrowth) summaries.push(`Crowd density changed ${densityGrowth}% compared to yesterday.`);

  const topGrowth = categoryGrowth.find((item) => item.today > 0 && item.growth > 0);
  if (topGrowth) summaries.push(`${topGrowth.category} reports increased ${topGrowth.growth}% today.`);

  return {
    hourly: hourly.map((item) => ({ label: item._id, reports: item.reports, avgDensity: round(item.avgDensity) })),
    daily: daily.map((item) => ({ label: item._id, reports: item.reports, avgDensity: round(item.avgDensity) })),
    weekly: daily.map((item) => ({ label: item._id, reports: item.reports, avgDensity: round(item.avgDensity) })),
    categoryGrowth,
    summaries,
    today: {
      reports: todayTotals?.reports || 0,
      avgDensity: round(todayTotals?.avgDensity || 0),
      highestDensity: todayTotals?.highestDensity || 0
    },
    yesterday: {
      reports: yesterdayTotals?.reports || 0,
      avgDensity: round(yesterdayTotals?.avgDensity || 0)
    }
  };
}

async function computeForecast() {
  const hourly = await Report.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%H:00', date: '$createdAt' } },
        avgDensity: { $avg: '$densityScore' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const densities = hourly.map((item) => item.avgDensity).filter((value) => Number.isFinite(value));
  const currentDensity = round(densities.at(-1) || 0);
  const last3 = densities.slice(-3);
  const last6 = densities.slice(-6);
  const last24 = densities.slice(-24);
  const weighted = last3.reduce((sum, value, index) => sum + value * (index + 1), 0) / Math.max(1, last3.length * (last3.length + 1) * 0.5);
  const avg6 = last6.reduce((sum, value) => sum + value, 0) / Math.max(1, last6.length);
  const avg24 = last24.reduce((sum, value) => sum + value, 0) / Math.max(1, last24.length);

  const forecast = await Forecast.create({
    currentDensity,
    predictions: {
      nextHour: round(Math.min(10, weighted || currentDensity)),
      next6Hours: round(Math.min(10, avg6 * 0.65 + (weighted || avg6) * 0.35)),
      next24Hours: round(Math.min(10, avg24 * 0.75 + (avg6 || avg24) * 0.25))
    },
    series: hourly.map((item) => ({ label: item._id, density: round(item.avgDensity) }))
  });

  await Forecast.deleteMany({ _id: { $ne: forecast._id }, createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
  return forecast;
}

async function createAnomalyIfNew(payload) {
  const since = new Date(Date.now() - 30 * 60 * 1000);
  const duplicate = await Anomaly.findOne({
    type: payload.type,
    category: payload.category || '',
    status: 'active',
    createdAt: { $gte: since }
  });

  if (duplicate) return duplicate;

  const anomaly = await Anomaly.create(payload);

  const alertDuplicate = await Alert.findOne({
    category: payload.category || payload.type,
    status: 'active',
    createdAt: { $gte: since }
  });

  if (!alertDuplicate) {
    await Alert.create({
      title: payload.title,
      message: payload.message,
      category: payload.category || payload.type,
      severity: payload.severity,
      threshold: Math.max(1, payload.baseline),
      count: Math.round(payload.observed),
      windowMinutes: 60
    });
  }

  return anomaly;
}

async function detectAnomalies(sourceReport) {
  const anomalies = [];
  const now = Date.now();
  const currentHour = new Date(now - 60 * 60 * 1000);
  const baselineStart = new Date(now - 7 * 60 * 60 * 1000);
  const previousDay = new Date(now - 24 * 60 * 60 * 1000);

  const [recent] = await Report.aggregate([
    { $match: { createdAt: { $gte: currentHour } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' }
      }
    }
  ]);

  const [baseline] = await Report.aggregate([
    { $match: { createdAt: { $gte: baselineStart, $lt: currentHour } } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgDensity: { $avg: '$densityScore' }
      }
    }
  ]);

  const baselineHourlyCount = (baseline?.count || 0) / 6;
  const densityChange = percentChange(recent?.avgDensity || 0, baseline?.avgDensity || 0);
  const frequencyChange = percentChange(recent?.count || 0, baselineHourlyCount);

  if ((recent?.avgDensity || 0) >= 7 && densityChange >= 60) {
    anomalies.push(
      await createAnomalyIfNew({
        type: 'density_spike',
        title: 'Anomaly Detected: Density spike',
        message: `Density spike ${densityChange}% above recent baseline.`,
        severity: densityChange >= 150 ? 'critical' : 'high',
        baseline: round(baseline?.avgDensity || 0),
        observed: round(recent?.avgDensity || 0),
        percentChange: densityChange,
        sourceReport: sourceReport?._id
      })
    );
  }

  if ((recent?.count || 0) >= 4 && frequencyChange >= 80) {
    anomalies.push(
      await createAnomalyIfNew({
        type: 'frequency_spike',
        title: 'Anomaly Detected: Report frequency surge',
        message: `Report frequency is ${frequencyChange}% above baseline.`,
        severity: frequencyChange >= 180 ? 'critical' : 'high',
        baseline: round(baselineHourlyCount),
        observed: recent?.count || 0,
        percentChange: frequencyChange,
        sourceReport: sourceReport?._id
      })
    );
  }

  if (sourceReport) {
    const currentCategoryCount = await Report.countDocuments({
      category: sourceReport.category,
      createdAt: { $gte: currentHour }
    });
    const previousCategoryCount = await Report.countDocuments({
      category: sourceReport.category,
      createdAt: { $gte: previousDay, $lt: currentHour }
    });
    const hourlyBaseline = previousCategoryCount / 23;
    const categoryChange = percentChange(currentCategoryCount, hourlyBaseline);

    if (currentCategoryCount >= 3 && categoryChange >= 100) {
      anomalies.push(
        await createAnomalyIfNew({
          type: 'category_surge',
          title: `Anomaly Detected: ${sourceReport.category} surge`,
          message: `${sourceReport.category} reports are ${categoryChange}% above normal.`,
          category: sourceReport.category,
          severity: categoryChange >= 200 ? 'critical' : 'high',
          baseline: round(hourlyBaseline),
          observed: currentCategoryCount,
          percentChange: categoryChange,
          sourceReport: sourceReport._id
        })
      );
    }
  }

  return anomalies.filter(Boolean);
}

async function computeRiskOverview() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [risk] = await Report.aggregate([
    { $match: { createdAt: { $gte: since24h }, status: { $ne: 'resolved' } } },
    {
      $group: {
        _id: null,
        averageRisk: { $avg: '$riskScore' },
        highestRisk: { $max: '$riskScore' },
        criticalReports: { $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } },
        highRiskReports: { $sum: { $cond: [{ $in: ['$riskLevel', ['high', 'critical']] }, 1, 0] } }
      }
    }
  ]);

  return {
    averageRisk: round(risk?.averageRisk || 0),
    highestRisk: Math.round(risk?.highestRisk || 0),
    criticalReports: risk?.criticalReports || 0,
    highRiskReports: risk?.highRiskReports || 0
  };
}

function buildRecommendations({ riskOverview, hotspots, forecast, anomalies, trends }) {
  const recommendations = [];

  if (riskOverview.highestRisk >= 85 || hotspots.some((hotspot) => hotspot.riskScore >= 85)) {
    recommendations.push({
      priority: 'critical',
      action: 'Deploy crowd-control personnel.',
      reason: 'Critical risk score detected in active operational zones.'
    });
  }

  if ((forecast?.predictions?.next6Hours || 0) >= 8) {
    recommendations.push({
      priority: 'high',
      action: 'Prepare overflow routing and increase monitoring frequency.',
      reason: 'Forecast predicts high crowd density within the next 6 hours.'
    });
  }

  if (anomalies.some((anomaly) => anomaly.type === 'density_spike')) {
    recommendations.push({
      priority: 'high',
      action: 'Dispatch field observers to validate density spike.',
      reason: 'Anomaly detection found density above normal baseline.'
    });
  }

  if (trends.categoryGrowth.some((item) => item.category === 'medical' && item.growth > 25)) {
    recommendations.push({
      priority: 'high',
      action: 'Increase medical response readiness.',
      reason: 'Medical incidents are increasing compared to the previous period.'
    });
  }

  if (hotspots.length >= 2) {
    recommendations.push({
      priority: 'moderate',
      action: 'Assign operators to top hotspot zones.',
      reason: `${hotspots.length} active hotspots detected.`
    });
  }

  if (!recommendations.length) {
    recommendations.push({
      priority: 'low',
      action: 'Continue standard monitoring cadence.',
      reason: 'No critical intelligence triggers are currently active.'
    });
  }

  return recommendations.slice(0, 6);
}

function buildOperationalSummary({ trends, hotspots, riskOverview, forecast, recommendations }) {
  const topCategory = trends.categoryGrowth.find((item) => item.today > 0);
  const activityShare = topCategory && trends.today.reports
    ? Math.round((topCategory.today / trends.today.reports) * 100)
    : 0;

  return [
    `${trends.today.reports} reports received today.`,
    topCategory ? `${topCategory.category} incidents account for ${activityShare}% of activity.` : 'No dominant incident category detected.',
    `Highest density reported: ${trends.today.highestDensity || 0}.`,
    `${hotspots.length} hotspot${hotspots.length === 1 ? '' : 's'} detected.`,
    `Operational risk level: ${riskLevelFromScore(riskOverview.highestRisk)}.`,
    `Predicted next-hour density: ${forecast?.predictions?.nextHour || 0}.`,
    `Recommended action: ${recommendations[0]?.action || 'Continue monitoring.'}`
  ].join(' ');
}

async function computeAreaAnalytics() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const areaWise = await Report.aggregate([
    { $match: { createdAt: { $gte: since7d } } },
    {
      $group: {
        _id: '$geo.areaName',
        reports: { $sum: 1 },
        avgRisk: { $avg: '$riskScore' },
        avgDensity: { $avg: '$densityScore' }
      }
    },
    { $sort: { avgRisk: -1, reports: -1 } },
    { $limit: 10 }
  ]);

  const cityWise = await Report.aggregate([
    { $match: { createdAt: { $gte: since7d } } },
    {
      $group: {
        _id: '$geo.city',
        reports: { $sum: 1 },
        avgRisk: { $avg: '$riskScore' }
      }
    },
    { $sort: { avgRisk: -1, reports: -1 } },
    { $limit: 10 }
  ]);

  const localityWise = await Report.aggregate([
    { $match: { createdAt: { $gte: since7d } } },
    {
      $group: {
        _id: '$geo.locality',
        reports: { $sum: 1 },
        avgRisk: { $avg: '$riskScore' }
      }
    },
    { $sort: { avgRisk: -1, reports: -1 } },
    { $limit: 10 }
  ]);

  return {
    areaWise: areaWise.filter((item) => item._id).map((item) => ({ area: item._id, reports: item.reports, avgRisk: round(item.avgRisk), avgDensity: round(item.avgDensity) })),
    cityWise: cityWise.filter((item) => item._id).map((item) => ({ city: item._id, reports: item.reports, avgRisk: round(item.avgRisk) })),
    localityWise: localityWise.filter((item) => item._id).map((item) => ({ locality: item._id, reports: item.reports, avgRisk: round(item.avgRisk) }))
  };
}

export async function recomputeOperationalIntelligence({ sourceReport } = {}) {
  await refreshRecentRiskScores();

  const [hotspots, trends, forecast, anomalies, riskOverview, geoAnalytics] = await Promise.all([
    computeHotspots(),
    computeTrendIntelligence(),
    computeForecast(),
    detectAnomalies(sourceReport),
    computeRiskOverview(),
    computeAreaAnalytics()
  ]);

  const activeAnomalies = await Anomaly.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10);
  const recommendations = buildRecommendations({ riskOverview, hotspots, forecast, anomalies: activeAnomalies, trends });
  const operationalRisk = {
    score: riskOverview.highestRisk,
    level: riskLevelFromScore(riskOverview.highestRisk)
  };
  const summary = buildOperationalSummary({ trends, hotspots, riskOverview, forecast, recommendations });

  const snapshot = await IntelligenceSnapshot.create({
    operationalRisk,
    riskOverview,
    trends,
    summary,
    recommendations,
    hotspotIds: hotspots.map((hotspot) => hotspot._id),
    anomalyIds: activeAnomalies.map((anomaly) => anomaly._id),
    forecastId: forecast._id
  });

  await IntelligenceSnapshot.deleteMany({ _id: { $ne: snapshot._id }, createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

  return {
    snapshot,
    operationalRisk,
    riskOverview,
    trends,
    hotspots,
    forecast,
    anomalies: activeAnomalies,
    recommendations,
    summary,
    geoAnalytics
  };
}

export async function getLatestIntelligence() {
  const [snapshot, hotspots, forecast, anomalies, geoAnalytics] = await Promise.all([
    IntelligenceSnapshot.findOne().sort({ createdAt: -1 }),
    Hotspot.find({ status: 'active' }).sort({ intensity: -1 }).limit(10),
    Forecast.findOne().sort({ createdAt: -1 }),
    Anomaly.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10),
    computeAreaAnalytics()
  ]);

  if (!snapshot) {
    return recomputeOperationalIntelligence();
  }

  return {
    snapshot,
    operationalRisk: snapshot.operationalRisk,
    riskOverview: snapshot.riskOverview,
    trends: snapshot.trends,
    hotspots,
    forecast,
    anomalies,
    recommendations: snapshot.recommendations,
    summary: snapshot.summary,
    geoAnalytics
  };
}
