import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useProjectStore } from '../state/projectStore';
import { buildLocationLayout, getOwnerPositionAt, getTimelineBounds } from '../core/simulation';
import type { Session } from '../domain/types';

const speeds = [0.5, 1, 2, 4];

interface Props {
  registerTogglePlay?: (toggle: () => void) => void;
}

export const MapView: FC<Props> = ({ registerTogglePlay }) => {
  const project = useProjectStore((state) => state.project);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const timelineBounds = useMemo(() => (project ? getTimelineBounds(project) : null), [project]);
  const layout = useMemo(() => (project ? buildLocationLayout(project) : new Map()), [project]);

  useEffect(() => {
    if (timelineBounds && !currentTime) {
      setCurrentTime(timelineBounds.inicio);
    }
  }, [timelineBounds, currentTime]);

  useEffect(() => {
    registerTogglePlay?.(() => setIsPlaying((prev) => !prev));
  }, [registerTogglePlay]);

  useEffect(() => {
    if (!isPlaying || !currentTime || !timelineBounds) return;
    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        if (!prev) return prev;
        const date = new Date(prev);
        date.setMinutes(date.getMinutes() + speed);
        if (date.toISOString() > timelineBounds.fin) {
          setIsPlaying(false);
          return timelineBounds.fin;
        }
        return date.toISOString();
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlaying, speed, timelineBounds, currentTime]);

  if (!project) {
    return <p className="notice">Crea un proyecto para activar la simulación en el mapa.</p>;
  }

  const owners: Array<{ id: string; nombre: string; rol: Session['ownerRol'] }> = [];
  if (project.cliente) {
    owners.push({ id: project.cliente.id, nombre: `Cliente: ${project.cliente.nombre}`, rol: 'CLIENTE' });
  }
  project.staff.forEach((member) => owners.push({ id: member.id, nombre: `Staff: ${member.nombre}`, rol: 'STAFF' }));

  const ownerPositions = owners.map((owner) => {
    const sessions = project.sesiones.filter((session) => session.ownerId === owner.id);
    const position = currentTime ? getOwnerPositionAt(sessions, layout, currentTime) : null;
    return { owner, position };
  });

  const goToMinutes = (minutes: number) => {
    if (!currentTime) return;
    const date = new Date(currentTime);
    date.setMinutes(date.getMinutes() + minutes);
    if (timelineBounds) {
      if (date.toISOString() < timelineBounds.inicio) {
        setCurrentTime(timelineBounds.inicio);
        return;
      }
      if (date.toISOString() > timelineBounds.fin) {
        setCurrentTime(timelineBounds.fin);
        return;
      }
    }
    setCurrentTime(date.toISOString());
  };

  const handleGoToHour = (value: string) => {
    if (!timelineBounds) return;
    const baseDate = new Date(timelineBounds.inicio);
    const [hours, minutes] = value.split(':');
    baseDate.setHours(Number(hours), Number(minutes), 0, 0);
    const iso = baseDate.toISOString();
    if (timelineBounds && (iso < timelineBounds.inicio || iso > timelineBounds.fin)) {
      setCurrentTime(timelineBounds.inicio);
    } else {
      setCurrentTime(iso);
    }
  };

  if (!timelineBounds) {
    return (
      <section className="card">
        <h3>Mapa y simulación</h3>
        <p>No hay sesiones planificadas todavía. Añade segmentos para visualizar el movimiento.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <header className="controls-row">
        <h3>Mapa y simulación</h3>
        <div className="controls-row">
          <button type="button" className="primary" onClick={() => setIsPlaying((prev) => !prev)} disabled={!timelineBounds}>
            {isPlaying ? 'Pausa' : 'Play'}
          </button>
          <span>{currentTime ? new Date(currentTime).toLocaleString('es-ES') : 'Sin hora seleccionada'}</span>
          <label>
            Velocidad
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
              {speeds.map((value) => (
                <option key={value} value={value}>
                  {value}×
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="ghost" onClick={() => goToMinutes(-15)}>
            −15 min
          </button>
          <button type="button" className="ghost" onClick={() => goToMinutes(-5)}>
            −5 min
          </button>
          <button type="button" className="ghost" onClick={() => goToMinutes(5)}>
            +5 min
          </button>
          <button type="button" className="ghost" onClick={() => goToMinutes(15)}>
            +15 min
          </button>
          <label>
            Ir a hora
            <input type="time" onChange={(event) => handleGoToHour(event.target.value)} />
          </label>
        </div>
      </header>
      <div className="map-container" role="application" aria-label="Mapa de ubicaciones">
        <svg className="map-svg" viewBox="0 0 100 66" aria-hidden="true">
          {Array.from(layout.entries()).map(([id, point]) => (
            <g key={id}>
              <circle cx={point.x * 100} cy={point.y * 66} r={2.5} fill="#143d59" />
              <text x={point.x * 100 + 3} y={point.y * 66} fontSize={2.5} fill="#143d59">
                {project.ubicaciones.find((loc) => loc.id === id)?.nombre ?? 'Ubicación'}
              </text>
            </g>
          ))}
          {ownerPositions.map(({ owner, position }, index) => (
            position && (
              <g key={owner.id}>
                <circle cx={position.x * 100} cy={position.y * 66} r={3.5} fill={index === 0 ? '#d23f3f' : '#1b76d2'} opacity={0.8} />
                <text x={position.x * 100 + 3} y={position.y * 66 - 2} fontSize={2.5} fill="#000">
                  {owner.nombre}
                </text>
              </g>
            )
          ))}
        </svg>
      </div>
    </section>
  );
};
