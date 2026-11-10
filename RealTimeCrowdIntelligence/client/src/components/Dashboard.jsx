import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, LogOut, Radio, RefreshCcw, Shield, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import SummaryCards from './SummaryCards';
import ReportForm from './ReportForm';
import LiveReports from './LiveReports';
import AnalyticsCharts from './AnalyticsCharts';
import CrowdMap from './CrowdMap';
import AlertsPanel from './AlertsPanel';
import IntelligencePanels from './IntelligencePanels';

function dedupeReports(reports) {
  const seen = new Set();

  return reports.filter((report) => {
    if (!report?._id || seen.has(report._id)) return false;
    seen.add(report._id);
    return true;
  });
}

function mergeReports(current, incoming, limit = 100) {
  const nextReports = Array.isArray(incoming) ? incoming : [incoming];
  return dedupeReports([...nextReports, ...current]).slice(0, limit);
}

function dedupeAlerts(alerts) {
  const seen = new Set();

  return alerts.filter((alert) => {
    if (!alert?._id || seen.has(alert._id)) return false;
    seen.add(alert._id);
    return true;
  });
}

function dedupeById(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item?._id || seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });
}

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);
  const loadRequestRef = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;

    if (mountedRef.current) setLoading(true);
    try {
      const [analyticsResponse, reportsResponse, intelligenceResponse] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/reports?limit=80'),
        api.get('/intelligence/overview')
      ]);
      if (!mountedRef.current || loadRequestRef.current !== requestId) return;
      setAnalytics((current) => ({
        ...analyticsResponse.data.analytics,
        activeAlerts: dedupeAlerts(analyticsResponse.data.analytics?.activeAlerts || current?.activeAlerts || [])
      }));
      setReports(dedupeReports(reportsResponse.data.reports || []));
      setIntelligence(intelligenceResponse.data.intelligence);
    } catch (error) {
      if (mountedRef.current && loadRequestRef.current === requestId) {
        toast.error(error.response?.data?.message || 'Unable to load dashboard');
      }
    } finally {
      if (mountedRef.current && loadRequestRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  const connected = useSocket({
    onReport: useCallback((report) => setReports((current) => mergeReports(current, report)), []),
    onAlert: useCallback((alert) => {
      setAnalytics((current) =>
        current
          ? (() => {
              const activeAlerts = dedupeAlerts([alert, ...(current.activeAlerts || [])]);
              return {
                ...current,
                activeAlerts,
                summary: {
                  ...current.summary,
                  activeAlerts: activeAlerts.length
                }
              };
            })()
          : current
      );
    }, []),
    onAnalytics: useCallback(
      (nextAnalytics) =>
        setAnalytics({
          ...nextAnalytics,
          activeAlerts: dedupeAlerts(nextAnalytics?.activeAlerts || [])
        }),
      []
    ),
    onRisk: useCallback((payload) => {
      setIntelligence((current) => ({
        ...(current || {}),
        operationalRisk: payload.operationalRisk,
        riskOverview: payload.riskOverview
      }));
    }, []),
    onHotspots: useCallback((hotspots) => {
      setIntelligence((current) => ({
        ...(current || {}),
        hotspots: dedupeById(hotspots)
      }));
    }, []),
    onForecast: useCallback((forecast) => {
      setIntelligence((current) => ({
        ...(current || {}),
        forecast
      }));
    }, []),
    onAnomaly: useCallback((anomaly) => {
      setIntelligence((current) => ({
        ...(current || {}),
        anomalies: dedupeById([anomaly, ...((current && current.anomalies) || [])])
      }));
    }, []),
    onRecommendations: useCallback((recommendations) => {
      setIntelligence((current) => ({
        ...(current || {}),
        recommendations
      }));
    }, []),
    onSummary: useCallback(({ summary, snapshot }) => {
      setIntelligence((current) => ({
        ...(current || {}),
        summary,
        snapshot
      }));
    }, [])
  });

  const recentReports = useMemo(() => dedupeReports(reports).slice(0, 8), [reports]);

  return (
    <main className="min-h-screen bg-mist">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-civic text-white">
                <Radio size={21} />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-ink">Crowd Intelligence</h1>
                <p className="text-xs font-semibold uppercase text-slate-500">Live operations dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`hidden items-center gap-2 border px-3 py-2 text-xs font-bold sm:flex ${connected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
              <span className={`h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {connected ? 'Live' : 'Offline'}
            </div>
            <button className="icon-btn" onClick={loadData} title="Refresh dashboard">
              <RefreshCcw size={18} />
            </button>
            <div className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2">
              {isAdmin ? <Shield size={18} className="text-civic" /> : <UserCircle size={18} className="text-slate-500" />}
              <span className="max-w-[140px] truncate text-sm font-bold text-ink">{user.name}</span>
            </div>
            <button className="icon-btn" onClick={logout} title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section className="space-y-5">
          <SummaryCards analytics={analytics} loading={loading} />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <CrowdMap points={analytics?.heatmap || []} reports={reports} />
            <ReportForm onCreated={(report) => setReports((current) => mergeReports(current, report))} />
          </div>
          <IntelligencePanels intelligence={intelligence} />
          <AnalyticsCharts analytics={analytics} loading={loading} />
        </section>

        <aside className="space-y-5">
          <AlertsPanel alerts={analytics?.activeAlerts || []} isAdmin={isAdmin} onChanged={loadData} />
          <LiveReports reports={recentReports} />
          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bell size={18} className="text-amberline" />
              <h2 className="text-sm font-extrabold text-ink">Trending issues</h2>
            </div>
            <div className="space-y-2">
              {(analytics?.trendingIssues || []).map((issue) => (
                <div key={`${issue.category}-${issue.severity}`} className="flex items-center justify-between border border-slate-100 px-3 py-2">
                  <div>
                    <p className="text-sm font-bold capitalize text-ink">{issue.category}</p>
                    <p className="text-xs capitalize text-slate-500">{issue.severity} · density {issue.avgDensity}</p>
                  </div>
                  <span className="text-sm font-extrabold text-civic">{issue.count}</span>
                </div>
              ))}
              {!analytics?.trendingIssues?.length && <p className="text-sm text-slate-500">No trends yet.</p>}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
