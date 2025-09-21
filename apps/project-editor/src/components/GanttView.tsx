import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { useProjectStore } from '../state/projectStore';
import type { Session } from '../domain/types';

const colorPalette = ['#1b76d2', '#d23f3f', '#17a398', '#f29f05', '#6a3fb1', '#2a6f4c'];

interface Props {
  zoom: number;
  onZoomChange: (value: number) => void;
}

export const GanttView: FC<Props> = ({ zoom, onZoomChange }) => {
  const project = useProjectStore((state) => state.project);

  const owners = useMemo(() => {
    if (!project) return [] as Array<{ id: string; nombre: string; rol: Session['ownerRol'] }>;
    const list: Array<{ id: string; nombre: string; rol: Session['ownerRol'] }> = [];
    if (project.cliente) {
      list.push({ id: project.cliente.id, nombre: `Cliente: ${project.cliente.nombre}`, rol: 'CLIENTE' });
    }
    project.staff.forEach((member) => list.push({ id: member.id, nombre: `Staff: ${member.nombre}`, rol: 'STAFF' }));
    return list;
  }, [project]);

  const [activeOwners, setActiveOwners] = useState<Set<string>>(() => new Set(owners.map((owner) => owner.id)));

  if (!project) {
    return <p className="notice">Crea un proyecto para visualizar los horarios.</p>;
  }

  const filteredSessions = project.sesiones.filter((session) => activeOwners.has(session.ownerId));

  if (filteredSessions.length === 0) {
    return (
      <div className="card">
        <h3>Horarios</h3>
        <p>No hay sesiones para mostrar. Añade segmentos al cliente o al staff.</p>
      </div>
    );
  }

  const sortedSessions = [...filteredSessions].sort((a, b) => (a.inicioISO < b.inicioISO ? -1 : 1));
  const minStart = new Date(sortedSessions[0].inicioISO).getTime();
  const maxEnd = new Date(sortedSessions[sortedSessions.length - 1].finISO).getTime();
  const totalMinutes = Math.max(1, Math.round((maxEnd - minStart) / 60000));
  const pixelsPerMinute = 2 * zoom;

  const axisLabels = (() => {
    const labels: string[] = [];
    const axisStart = new Date(minStart);
    axisStart.setMinutes(0, 0, 0);
    for (let time = axisStart.getTime(); time <= maxEnd; time += 60 * 60 * 1000) {
      labels.push(new Date(time).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }));
    }
    return labels;
  })();

  const computeLeft = (session: Session) => ((new Date(session.inicioISO).getTime() - minStart) / 60000) * pixelsPerMinute;
  const computeWidth = (session: Session) => (new Date(session.finISO).getTime() - new Date(session.inicioISO).getTime()) / 60000 * pixelsPerMinute;

  return (
    <section className="card">
      <header className="controls-row">
        <h3>Horarios</h3>
        <div className="controls-row" role="group" aria-label="Zoom">
          <button type="button" onClick={() => onZoomChange(Math.max(0.5, zoom - 0.25))} className="ghost">
            -
          </button>
          <span>Zoom {zoom.toFixed(2)}x</span>
          <button type="button" onClick={() => onZoomChange(Math.min(4, zoom + 0.25))} className="ghost">
            +
          </button>
        </div>
      </header>
      <div className="controls-row" role="group" aria-label="Filtros">
        {owners.map((owner, index) => (
          <label key={owner.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <input
              type="checkbox"
              checked={activeOwners.has(owner.id)}
              onChange={(event) => {
                setActiveOwners((prev) => {
                  const next = new Set(prev);
                  if (event.target.checked) {
                    next.add(owner.id);
                  } else {
                    next.delete(owner.id);
                  }
                  return next;
                });
              }}
            />
            <span className="badge" style={{ background: colorPalette[index % colorPalette.length], color: '#fff' }}>
              {owner.nombre}
            </span>
          </label>
        ))}
      </div>
      <div className="gantt-container" role="figure" aria-label="Vista tipo Gantt">
        <div className="gantt-axis">
          {axisLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="gantt-grid" style={{ width: totalMinutes * pixelsPerMinute + 200 }}>
          {owners
            .filter((owner) => activeOwners.has(owner.id))
            .map((owner, ownerIndex) => {
              const sessions = project.sesiones.filter((session) => session.ownerId === owner.id);
              return (
                <div className="gantt-row" key={owner.id}>
                  <div className="gantt-label">{owner.nombre}</div>
                  <div className="gantt-track">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="gantt-block"
                        style={{
                          left: computeLeft(session),
                          width: Math.max(24, computeWidth(session)),
                          background: colorPalette[ownerIndex % colorPalette.length]
                        }}
                        title={`${new Date(session.inicioISO).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${new Date(session.finISO).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        {session.tareaId ? project.tareas.find((t) => t.id === session.tareaId)?.nombre ?? 'Sesión' : 'Sesión'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
};
