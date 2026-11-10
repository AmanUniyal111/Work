import { BarChart3 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { categoryColors } from '../lib/constants';

export default function AnalyticsCharts({ analytics, loading }) {
  const categoryData = analytics?.byCategory || [];
  const timeline = analytics?.timeline || [];

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="panel p-4">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-civic" />
          <h2 className="text-sm font-extrabold text-ink">Reports by category</h2>
        </div>
        <div className="h-72">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.category} fill={categoryColors[entry.category] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="panel p-4">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-amberline" />
          <h2 className="text-sm font-extrabold text-ink">Seven-day density trend</h2>
        </div>
        <div className="h-72">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="reports" stroke="#0f766e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="avgDensity" stroke="#d97706" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
