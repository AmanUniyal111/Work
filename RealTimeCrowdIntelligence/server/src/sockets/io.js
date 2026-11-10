let ioInstance;

export function registerSocketServer(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    socket.emit('socket:ready', { socketId: socket.id });

    socket.on('dashboard:join', () => {
      socket.join('dashboard');
    });

    socket.on('dashboard:leave', () => {
      socket.leave('dashboard');
    });
  });
}

export function emitReportCreated(report) {
  ioInstance?.to('dashboard').emit('report:created', report);
}

export function emitAlertCreated(alert) {
  ioInstance?.to('dashboard').emit('alert:created', alert);
}

export function emitAnalyticsUpdated(payload) {
  ioInstance?.to('dashboard').emit('analytics:updated', payload);
}

export function emitIntelligenceUpdated(intelligence) {
  ioInstance?.to('dashboard').emit('risk:updated', {
    operationalRisk: intelligence.operationalRisk,
    riskOverview: intelligence.riskOverview
  });
  ioInstance?.to('dashboard').emit('hotspot:updated', {
    hotspots: intelligence.hotspots
  });
  ioInstance?.to('dashboard').emit('forecast:updated', {
    forecast: intelligence.forecast
  });
  ioInstance?.to('dashboard').emit('recommendation:updated', {
    recommendations: intelligence.recommendations
  });
  ioInstance?.to('dashboard').emit('summary:updated', {
    summary: intelligence.summary,
    snapshot: intelligence.snapshot
  });

  for (const anomaly of intelligence.anomalies || []) {
    ioInstance?.to('dashboard').emit('anomaly:detected', anomaly);
  }
}
