import { Activity, AlertTriangle, Brain, Compass, Crosshair, Lightbulb, MapPinned, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const riskTone = {
  low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  high: 'text-orange-700 bg-orange-50 border-orange-200',
  critical: 'text-red-700 bg-red-50 border-red-200'
};

function EmptyState({ label }) {
  return <p className="text-sm text-slate-500">{label}</p>;
}

export default function IntelligencePanels({ intelligence }) {
  const operationalRisk = intelligence?.operationalRisk || { score: 0, level: 'low' };
  const riskOverview = intelligence?.riskOverview || {};
  const hotspots = intelligence?.hotspots || [];
  const forecast = intelligence?.forecast;
  const anomalies = intelligence?.anomalies || [];
  const recommendations = intelligence?.recommendations || [];
  const trends = intelligence?.trends || {};
  const geoAnalytics = intelligence?.geoAnalytics || {};
  const forecastData = [
    { label: 'Now', density: forecast?.currentDensity || 0 },
    { label: '+1h', density: forecast?.predictions?.nextHour || 0 },
    { label: '+6h', density: forecast?.predictions?.next6Hours || 0 },
    { label: '+24h', density: forecast?.predictions?.next24Hours || 0 }
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <Activity size={18} className="text-civic" />
            <h2 className="text-sm font-extrabold text-ink">Operational risk</h2>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-5xl font-extrabold text-ink">{operationalRisk.score || 0}</p>
            <span className={`mb-2 border px-2 py-1 text-xs font-extrabold capitalize ${riskTone[operationalRisk.level] || riskTone.low}`}>
              {operationalRisk.level}
            </span>
          </div>
          <div className="mt-4 h-3 bg-slate-100">
            <div className="h-full bg-civic" style={{ width: `${Math.min(100, operationalRisk.score || 0)}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="label">Average</p>
              <p className="font-extrabold text-ink">{riskOverview.averageRisk || 0}</p>
            </div>
            <div>
              <p className="label">High risk</p>
              <p className="font-extrabold text-ink">{riskOverview.highRiskReports || 0}</p>
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <Brain size={18} className="text-civic" />
            <h2 className="text-sm font-extrabold text-ink">AI situation summary</h2>
          </div>
          <p className="text-sm leading-6 text-steel">{intelligence?.summary || 'Intelligence summary will appear after reports are analyzed.'}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(trends.summaries || []).slice(0, 4).map((summary) => (
              <div key={summary} className="border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                {summary}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <Crosshair size={18} className="text-signal" />
            <h2 className="text-sm font-extrabold text-ink">Active hotspots</h2>
          </div>
          <div className="space-y-3">
            {hotspots.map((hotspot, index) => (
              <div key={hotspot._id || hotspot.name} className="border border-slate-100 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-extrabold text-ink">{index + 1}. {hotspot.name}</p>
                  <span className="text-sm font-extrabold text-signal">{hotspot.riskScore}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Density {hotspot.avgDensity} · {hotspot.reportCount} reports · intensity {Math.round(hotspot.intensity || 0)}</p>
              </div>
            ))}
            {!hotspots.length && <EmptyState label="No active hotspots detected." />}
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-amberline" />
            <h2 className="text-sm font-extrabold text-ink">Density forecast</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="density" stroke="#0f766e" fill="#0f766e" fillOpacity={0.18} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-signal" />
            <h2 className="text-sm font-extrabold text-ink">Anomaly feed</h2>
          </div>
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <div key={anomaly._id} className="border border-red-100 bg-red-50/60 px-3 py-2">
                <p className="text-sm font-extrabold text-ink">{anomaly.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{anomaly.message}</p>
              </div>
            ))}
            {!anomalies.length && <EmptyState label="No active anomalies." />}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-amberline" />
            <h2 className="text-sm font-extrabold text-ink">Recommended actions</h2>
          </div>
          <div className="space-y-2">
            {recommendations.map((recommendation) => (
              <div key={`${recommendation.priority}-${recommendation.action}`} className="border border-slate-100 px-3 py-2">
                <p className="text-sm font-extrabold text-ink">{recommendation.action}</p>
                <p className="mt-1 text-xs text-slate-500 capitalize">{recommendation.priority} · {recommendation.reason}</p>
              </div>
            ))}
            {!recommendations.length && <EmptyState label="No recommendations yet." />}
          </div>
        </div>

        <div className="panel p-4">
          <div className="mb-4 flex items-center gap-2">
            <MapPinned size={18} className="text-civic" />
            <h2 className="text-sm font-extrabold text-ink">Geo intelligence</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {(geoAnalytics.areaWise || []).slice(0, 3).map((area) => (
              <div key={area.area} className="border border-slate-100 px-3 py-2">
                <Compass size={16} className="mb-2 text-civic" />
                <p className="text-sm font-extrabold text-ink">{area.area}</p>
                <p className="mt-1 text-xs text-slate-500">{area.reports} reports · risk {area.avgRisk}</p>
              </div>
            ))}
          </div>
          {!geoAnalytics.areaWise?.length && <EmptyState label="Area intelligence will appear after geocoded reports are available." />}
        </div>
      </section>
    </div>
  );
}
