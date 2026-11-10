import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { severityTone } from '../lib/constants';

function uniqueReports(reports) {
  const seen = new Set();

  return reports.filter((report) => {
    if (!report?._id || seen.has(report._id)) return false;
    seen.add(report._id);
    return true;
  });
}

export default function LiveReports({ reports }) {
  const visibleReports = useMemo(() => uniqueReports(reports), [reports]);

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock size={18} className="text-civic" />
        <h2 className="text-sm font-extrabold text-ink">Live report feed</h2>
      </div>
      <div className="space-y-3">
        {visibleReports.map((report) => (
          <article key={report._id} className="border border-slate-100 p-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-extrabold text-ink">{report.title}</h3>
              <span className={`border px-2 py-1 text-[11px] font-bold capitalize ${severityTone[report.severity]}`}>{report.severity}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{report.description}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase text-slate-400">
              <span>{report.category}</span>
              <span>density {report.densityScore}</span>
              <span>risk {report.riskScore || 0}</span>
              <span>{report.riskLevel || 'low'}</span>
              <span>{new Date(report.createdAt).toLocaleTimeString()}</span>
            </div>
          </article>
        ))}
        {!visibleReports.length && <p className="text-sm text-slate-500">No reports yet.</p>}
      </div>
    </div>
  );
}
