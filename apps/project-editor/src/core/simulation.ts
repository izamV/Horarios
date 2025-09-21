import { parseDate } from '../adapters/datetime';
import type { Location, Project, Session } from '../domain/types';

export interface Point {
  x: number;
  y: number;
}

const normalizeLatLng = (locations: Location[]): Map<string, Point> => {
  const latitudes = locations.map((loc) => loc.lat ?? 0);
  const longitudes = locations.map((loc) => loc.lng ?? 0);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const layout = new Map<string, Point>();
  locations.forEach((loc, index) => {
    if (loc.lat !== undefined && loc.lng !== undefined) {
      const x = (loc.lng - minLng) / lngRange;
      const y = 1 - (loc.lat - minLat) / latRange;
      layout.set(loc.id, { x, y });
    } else {
      const angle = (index / Math.max(1, locations.length)) * Math.PI * 2;
      const radius = 0.3 + (index % 5) * 0.1;
      layout.set(loc.id, {
        x: 0.5 + radius * Math.cos(angle),
        y: 0.5 + radius * Math.sin(angle)
      });
    }
  });
  return layout;
};

export const buildLocationLayout = (project: Project): Map<string, Point> => {
  if (project.ubicaciones.length === 0) {
    return new Map();
  }
  return normalizeLatLng(project.ubicaciones);
};

const toMillis = (iso: string) => parseDate(iso).getTime();

const interpolate = (a: Point, b: Point, ratio: number): Point => ({
  x: a.x + (b.x - a.x) * ratio,
  y: a.y + (b.y - a.y) * ratio
});

const getSessionLocation = (session: Session, layout: Map<string, Point>): Point | null => {
  if (!session.locationId) return null;
  return layout.get(session.locationId) ?? null;
};

export const getOwnerPositionAt = (
  sessions: Session[],
  layout: Map<string, Point>,
  timestampISO: string
): Point | null => {
  const time = toMillis(timestampISO);
  const sorted = [...sessions].sort((a, b) => (a.inicioISO < b.inicioISO ? -1 : 1));
  if (sorted.length === 0) {
    return null;
  }
  for (let i = 0; i < sorted.length; i++) {
    const session = sorted[i];
    const start = toMillis(session.inicioISO);
    const end = toMillis(session.finISO);
    if (time >= start && time <= end) {
      return getSessionLocation(session, layout);
    }
    if (time < start) {
      const prev = sorted[i - 1];
      if (prev) {
        const prevPos = getSessionLocation(prev, layout);
        const nextPos = getSessionLocation(session, layout);
        if (prevPos && nextPos) {
          const travelStart = toMillis(prev.finISO);
          const travelDuration = start - travelStart;
          if (travelDuration > 0) {
            const ratio = (time - travelStart) / travelDuration;
            if (ratio >= 0 && ratio <= 1) {
              return interpolate(prevPos, nextPos, ratio);
            }
          }
        }
        return prevPos ?? nextPos;
      }
      return getSessionLocation(session, layout);
    }
  }
  const last = sorted[sorted.length - 1];
  return getSessionLocation(last, layout);
};

export const getTimelineBounds = (project: Project): { inicio: string; fin: string } | null => {
  if (project.sesiones.length === 0) return null;
  const sorted = [...project.sesiones].sort((a, b) => (a.inicioISO < b.inicioISO ? -1 : 1));
  return { inicio: sorted[0].inicioISO, fin: sorted[sorted.length - 1].finISO };
};
