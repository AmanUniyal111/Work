import { Activity, AlertTriangle, Gauge, Layers, TimerReset } from 'lucide-react';

const cards = [
  ['totalReports', 'Total reports', Activity],
  ['openReports', 'Open reports', Layers],
  ['criticalReports', 'Critical', AlertTriangle],
  ['avgDensity', 'Avg density', Gauge],
  ['highestRisk', 'Peak risk', AlertTriangle],
  ['last24Hours', 'Last 24h', TimerReset]
];

export default function SummaryCards({ analytics, loading }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map(([key, label, Icon]) => (
        <div key={key} className="panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
            <Icon size={18} className="text-civic" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">{loading ? '...' : analytics?.summary?.[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}
