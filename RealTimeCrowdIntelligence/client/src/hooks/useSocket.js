import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { SOCKET_URL } from '../lib/api';

let dashboardSocket;
let subscribers = 0;
let disconnectTimer;

function getDashboardSocket() {
  if (!dashboardSocket) {
    dashboardSocket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000
    });
  }

  return dashboardSocket;
}

export function useSocket({
  onReport,
  onAlert,
  onAnalytics,
  onRisk,
  onHotspots,
  onForecast,
  onAnomaly,
  onRecommendations,
  onSummary
}) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef({
    onReport,
    onAlert,
    onAnalytics,
    onRisk,
    onHotspots,
    onForecast,
    onAnomaly,
    onRecommendations,
    onSummary
  });

  useEffect(() => {
    handlersRef.current = {
      onReport,
      onAlert,
      onAnalytics,
      onRisk,
      onHotspots,
      onForecast,
      onAnomaly,
      onRecommendations,
      onSummary
    };
  }, [onAlert, onAnalytics, onAnomaly, onForecast, onHotspots, onRecommendations, onReport, onRisk, onSummary]);

  useEffect(() => {
    const socket = getDashboardSocket();
    subscribers += 1;

    if (disconnectTimer) {
      clearTimeout(disconnectTimer);
      disconnectTimer = undefined;
    }

    function handleConnect() {
      setConnected(true);
      socket.emit('dashboard:join');
    }

    function handleDisconnect() {
      setConnected(false);
    }

    function handleReport(report) {
      toast.success(`New ${report.category} report received`);
      handlersRef.current.onReport?.(report);
    }

    function handleAlert(alert) {
      toast.error(alert.title);
      handlersRef.current.onAlert?.(alert);
    }

    function handleAnalytics({ analytics }) {
      if (analytics) handlersRef.current.onAnalytics?.(analytics);
    }

    function handleRisk(payload) {
      handlersRef.current.onRisk?.(payload);
    }

    function handleHotspots({ hotspots }) {
      handlersRef.current.onHotspots?.(hotspots || []);
    }

    function handleForecast({ forecast }) {
      handlersRef.current.onForecast?.(forecast);
    }

    function handleAnomaly(anomaly) {
      toast.error(anomaly.title || 'Anomaly detected');
      handlersRef.current.onAnomaly?.(anomaly);
    }

    function handleRecommendations({ recommendations }) {
      handlersRef.current.onRecommendations?.(recommendations || []);
    }

    function handleSummary({ summary, snapshot }) {
      handlersRef.current.onSummary?.({ summary, snapshot });
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('report:created', handleReport);
    socket.on('alert:created', handleAlert);
    socket.on('analytics:updated', handleAnalytics);
    socket.on('risk:updated', handleRisk);
    socket.on('hotspot:updated', handleHotspots);
    socket.on('forecast:updated', handleForecast);
    socket.on('anomaly:detected', handleAnomaly);
    socket.on('recommendation:updated', handleRecommendations);
    socket.on('summary:updated', handleSummary);

    if (!socket.connected) socket.connect();
    else handleConnect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('report:created', handleReport);
      socket.off('alert:created', handleAlert);
      socket.off('analytics:updated', handleAnalytics);
      socket.off('risk:updated', handleRisk);
      socket.off('hotspot:updated', handleHotspots);
      socket.off('forecast:updated', handleForecast);
      socket.off('anomaly:detected', handleAnomaly);
      socket.off('recommendation:updated', handleRecommendations);
      socket.off('summary:updated', handleSummary);
      socket.emit('dashboard:leave');
      subscribers = Math.max(0, subscribers - 1);

      disconnectTimer = setTimeout(() => {
        if (subscribers === 0) {
          socket.disconnect();
        }
      }, 250);
    };
  }, []);

  return connected;
}
