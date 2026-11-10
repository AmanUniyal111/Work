import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';

export default function AlertsPanel({ alerts, isAdmin, onChanged }) {
  async function updateStatus(alertId, status) {
    try {
      await api.patch(`/alerts/${alertId}/status`, { status });
      toast.success(`Alert ${status}`);
      onChanged?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update alert');
    }
  }

  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={18} className="text-signal" />
        <h2 className="text-sm font-extrabold text-ink">Active alerts</h2>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <article key={alert._id} className="border border-red-100 bg-red-50/60 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold capitalize text-ink">{alert.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">{alert.message}</p>
              </div>
              <span className="bg-white px-2 py-1 text-xs font-extrabold text-signal">{alert.count}</span>
            </div>
            {isAdmin && (
              <button onClick={() => updateStatus(alert._id, 'acknowledged')} className="mt-3 inline-flex items-center gap-2 border border-red-200 bg-white px-3 py-2 text-xs font-bold text-signal transition hover:bg-red-100">
                <CheckCircle2 size={15} />
                Acknowledge
              </button>
            )}
          </article>
        ))}
        {!alerts.length && <p className="text-sm text-slate-500">No active threshold alerts.</p>}
      </div>
    </div>
  );
}
