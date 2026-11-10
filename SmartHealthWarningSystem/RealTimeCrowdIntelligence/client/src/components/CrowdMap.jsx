import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Map } from 'lucide-react';

const heatLayerOptions = {
  radius: 28,
  blur: 20,
  minOpacity: 0.35,
  gradient: {
    0.2: '#0f766e',
    0.5: '#d97706',
    0.8: '#dc2626'
  }
};

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function normalizeHeatPoints(points = []) {
  if (!Array.isArray(points)) return [];

  return points
    .map((point) => {
      const lat = Number(point?.lat);
      const lng = Number(point?.lng);
      const intensity = Number(point?.intensity);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return [lat, lng, Math.max((Number.isFinite(intensity) ? intensity : 1) / 10, 0.2)];
    })
    .filter(Boolean);
}

function isMapReady(map) {
  if (!map?.getContainer || !map?.getSize) return false;

  const container = map.getContainer();
  const size = map.getSize();

  return Boolean(container && size.x > 0 && size.y > 0);
}

function cancelHeatRedraw(layer) {
  if (layer?._frame) {
    L.Util.cancelAnimFrame(layer._frame);
    layer._frame = null;
  }
}

function withFrequentReadbackCanvas(callback) {
  const originalCreateElement = document.createElement.bind(document);

  document.createElement = (tagName, elementOptions) => {
    const element = originalCreateElement(tagName, elementOptions);

    if (tagName.toLowerCase() === 'canvas') {
      const originalGetContext = element.getContext.bind(element);
      element.getContext = (contextType, contextOptions) =>
        originalGetContext(
          contextType,
          contextType === '2d' ? { willReadFrequently: true, ...contextOptions } : contextOptions
        );
    }

    return element;
  };

  try {
    return callback();
  } finally {
    document.createElement = originalCreateElement;
  }
}

function createGuardedHeatLayer(points = [], options = heatLayerOptions) {
  const layer = L.heatLayer(points, options);
  const originalRedraw = layer._redraw;

  layer._redraw = function guardedRedraw() {
    if (!this._map) {
      this._frame = null;
      return this;
    }

    return originalRedraw.call(this);
  };

  return layer;
}

function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);
  const heatPointsRef = useRef([]);
  const heatPoints = useMemo(() => normalizeHeatPoints(points), [points]);

  useEffect(() => {
    heatPointsRef.current = heatPoints;
  }, [heatPoints]);

  useEffect(() => {
    let cancelled = false;

    function addLayer() {
      if (cancelled || layerRef.current || !isMapReady(map)) return;

      const layer = createGuardedHeatLayer([], heatLayerOptions);
      layerRef.current = layer;
      withFrequentReadbackCanvas(() => layer.addTo(map));
      layer.setLatLngs(heatPointsRef.current);
    }

    map.whenReady(addLayer);

    return () => {
      cancelled = true;
      map.off('load', addLayer);

      const layer = layerRef.current;
      if (!layer) return;

      cancelHeatRedraw(layer);
      layer.off();
      if (map.hasLayer(layer)) map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const layer = layerRef.current;

    if (!layer || !isMapReady(map)) return;

    cancelHeatRedraw(layer);
    layer.setLatLngs(heatPoints);
  }, [heatPoints, map]);

  return null;
}

function useUniqueMappableReports(reports) {
  return useMemo(() => {
    const seen = new Set();

    return reports.filter((report) => {
      const [lng, lat] = report.location?.coordinates || [];
      if (!report?._id || seen.has(report._id) || !lat || !lng) return false;
      seen.add(report._id);
      return true;
    });
  }, [reports]);
}

export default function CrowdMap({ points, reports }) {
  const safePoints = Array.isArray(points) ? points : [];
  const center = safePoints[0] ? [safePoints[0].lat, safePoints[0].lng] : [28.6139, 77.209];
  const mappableReports = useUniqueMappableReports(reports).slice(0, 30);

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Map size={18} className="text-civic" />
          <h2 className="text-sm font-extrabold text-ink">Crowd density heatmap</h2>
        </div>
        <p className="text-xs font-bold uppercase text-slate-500">{safePoints.length} live points</p>
      </div>
      <div className="h-[430px]">
        <MapContainer center={center} zoom={13} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatLayer points={safePoints} />
          {mappableReports.map((report) => {
            const [lng, lat] = report.location.coordinates;
            return (
              <Marker key={report._id} position={[lat, lng]} icon={markerIcon}>
                <Popup>
                  <strong>{report.title}</strong>
                  <br />
                  {report.category} · {report.severity} · density {report.densityScore}
                  <br />
                  Risk {report.riskScore || 0} · {report.riskLevel || 'low'}
                  {report.geo?.areaName ? (
                    <>
                      <br />
                      {report.geo.areaName}
                    </>
                  ) : null}
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}
