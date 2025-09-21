import type { FC, ChangeEvent } from 'react';
import { useState, useMemo } from 'react';
import { minutesOptions, fromDateTimeInputs, toTimeInputValue } from '../utils/time';
import { useProjectStore } from '../state/projectStore';
import type { Session } from '../domain/types';

interface Props {
  ownerId: string;
  ownerRol: Session['ownerRol'];
  ownerNombre: string;
}

export const ScheduleEditor: FC<Props> = ({ ownerId, ownerRol, ownerNombre }) => {
  const project = useProjectStore((state) => state.project);
  const appendSequentialSessions = useProjectStore((state) => state.appendSequentialSessions);
  const updateSession = useProjectStore((state) => state.updateSession);
  const removeSession = useProjectStore((state) => state.removeSession);
  const changeDuration = useProjectStore((state) => state.changeSessionDuration);
  const shiftSession = useProjectStore((state) => state.shiftSession);
  const addLocation = useProjectStore((state) => state.addLocation);
  const addTaskType = useProjectStore((state) => state.addTaskType);
  const addMaterialType = useProjectStore((state) => state.addMaterialType);
  const setSessionMaterials = useProjectStore((state) => state.setSessionMaterials);
  const lastError = useProjectStore((state) => state.lastError);

  const ownerSessions = useMemo(
    () => project?.sesiones.filter((session) => session.ownerId === ownerId && session.ownerRol === ownerRol) ?? [],
    [project?.sesiones, ownerId, ownerRol]
  );

  const [fechaBase, setFechaBase] = useState(() => project ? project.fechas.inicio.slice(0, 10) : '');
  const [horaBase, setHoraBase] = useState('09:00');
  const [nextStart, setNextStart] = useState(() => (fechaBase ? fromDateTimeInputs(fechaBase, horaBase) : ''));

  if (!project) {
    return <p className="notice">Necesitas crear un proyecto para editar horarios.</p>;
  }

  const handleDurationClick = (minutes: number) => {
    if (!fechaBase) return;
    const startISO = nextStart || fromDateTimeInputs(fechaBase, horaBase);
    const sessions = appendSequentialSessions({ startISO, durations: [minutes], ownerId, ownerRol });
    if (sessions.length > 0) {
      setNextStart(sessions[sessions.length - 1].finISO);
    }
  };

  const handleSessionChange = (session: Session, field: 'locationId' | 'tareaId', value: string | undefined) => {
    if (field === 'locationId') {
      updateSession(session.id, { locationId: value });
    } else {
      updateSession(session.id, { tareaId: value });
    }
  };

  const handleInfoChange = (session: Session, event: ChangeEvent<HTMLTextAreaElement>) => {
    updateSession(session.id, { infoExtra: event.target.value });
  };

  const handleMaterialQuantityChange = (session: Session, index: number, quantity: number) => {
    const materials = session.materiales ? [...session.materiales] : [];
    materials[index] = { ...materials[index], cantidad: quantity };
    setSessionMaterials(session.id, materials);
  };

  const handleMaterialSelectionChange = (session: Session, index: number, materialId: string) => {
    const materials = session.materiales ? [...session.materiales] : [];
    materials[index] = { ...materials[index], materialId };
    setSessionMaterials(session.id, materials);
  };

  const handleAddMaterial = (session: Session) => {
    const materials = session.materiales ? [...session.materiales] : [];
    let materialId: string | undefined = project.materiales[0]?.id;

    if (!materialId) {
      const nombre = window.prompt('Nombre del material');
      if (!nombre) return;
      const unidad = window.prompt('Unidad de medida', 'unidad');
      if (!unidad) return;
      const nuevo = addMaterialType({ nombre, unidad });
      if (!nuevo) return;
      materialId = nuevo.id;
    }

    if (!materialId) return;

    materials.push({ materialId, cantidad: 1 });
    setSessionMaterials(session.id, materials);
  };

  const handleRemoveMaterial = (session: Session, index: number) => {
    const materials = session.materiales ? [...session.materiales] : [];
    materials.splice(index, 1);
    setSessionMaterials(session.id, materials);
  };

  const ensureLocation = () => {
    const nombre = window.prompt('Nombre de la ubicación');
    if (!nombre) return;
    const latStr = window.prompt('Latitud (opcional)');
    const lngStr = window.prompt('Longitud (opcional)');
    const lat = latStr ? Number(latStr) : undefined;
    const lng = lngStr ? Number(lngStr) : undefined;
    addLocation({ nombre, lat, lng });
  };

  const ensureTask = () => {
    const nombre = window.prompt('Nombre de la tarea');
    if (!nombre) return;
    addTaskType({ nombre });
  };

  return (
    <section className="card" aria-label={`Horario de ${ownerNombre}`}>
      <header className="controls-row">
        <h2>Horario de {ownerNombre}</h2>
        <div className="controls-row" role="group" aria-label="Configuración de inicio">
          <label>
            Fecha base
            <input type="date" value={fechaBase} onChange={(event) => {
              setFechaBase(event.target.value);
              setNextStart(fromDateTimeInputs(event.target.value, horaBase));
            }} />
          </label>
          <label>
            Hora inicial
            <input
              type="time"
              value={horaBase}
              onChange={(event) => {
                setHoraBase(event.target.value);
                setNextStart(fromDateTimeInputs(fechaBase, event.target.value));
              }}
            />
          </label>
        </div>
        <div className="controls-row" role="group" aria-label="Crear segmento">
          {minutesOptions.map((minutes) => (
            <button type="button" key={minutes} onClick={() => handleDurationClick(minutes)} className="ghost">
              +{minutes} min
            </button>
          ))}
        </div>
      </header>
      {lastError && <p className="notice" role="alert">{lastError}</p>}
      {ownerSessions.length === 0 && <p>No hay segmentos asignados todavía.</p>}
      {ownerSessions.map((session) => (
        <article key={session.id} className="schedule-session">
          <header>
            <strong>
              {new Date(session.inicioISO).toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              })}{' '}
              - {toTimeInputValue(session.finISO)}
            </strong>
            <div className="controls-row">
              <button type="button" onClick={() => shiftSession(session.id, -5)} className="ghost" aria-label="Adelantar 5 minutos">
                -5
              </button>
              <button type="button" onClick={() => shiftSession(session.id, 5)} className="ghost" aria-label="Retrasar 5 minutos">
                +5
              </button>
              <button type="button" onClick={() => removeSession(session.id)} className="danger">
                Eliminar
              </button>
            </div>
          </header>
          <form className="grid" aria-label="Editar segmento">
            <label>
              Ubicación
              <select
                value={session.locationId ?? ''}
                onChange={(event) => handleSessionChange(session, 'locationId', event.target.value || undefined)}
              >
                <option value="">Selecciona ubicación</option>
                {project.ubicaciones.map((loc) => (
                  <option value={loc.id} key={loc.id}>
                    {loc.nombre}
                  </option>
                ))}
              </select>
              <button type="button" className="ghost" onClick={ensureLocation}>
                Crear ubicación
              </button>
            </label>
            <label>
              Tarea
              <select value={session.tareaId ?? ''} onChange={(event) => handleSessionChange(session, 'tareaId', event.target.value || undefined)}>
                <option value="">Selecciona tarea</option>
                {project.tareas.map((task) => (
                  <option value={task.id} key={task.id}>
                    {task.nombre}
                  </option>
                ))}
              </select>
              <button type="button" className="ghost" onClick={ensureTask}>
                Crear tarea
              </button>
            </label>
            <label>
              Duración (minutos)
              <input
                type="number"
                min={5}
                step={5}
                value={Math.max(5, Math.round((new Date(session.finISO).getTime() - new Date(session.inicioISO).getTime()) / 60000))}
                onChange={(event) => changeDuration(session.id, Number(event.target.value))}
              />
            </label>
            <fieldset>
              <legend>Materiales</legend>
              <div className="material-list">
                {(session.materiales ?? []).map((material, index) => (
                  <div className="material-row" key={`${session.id}-${index}`}>
                    <select
                      value={material.materialId}
                      onChange={(event) => handleMaterialSelectionChange(session, index, event.target.value)}
                    >
                      {project.materiales.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={material.cantidad}
                      onChange={(event) => handleMaterialQuantityChange(session, index, Number(event.target.value))}
                    />
                    <button type="button" className="ghost" onClick={() => handleRemoveMaterial(session, index)}>
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="ghost" onClick={() => handleAddMaterial(session)}>
                Añadir material
              </button>
            </fieldset>
            <label>
              Información extra
              <textarea value={session.infoExtra ?? ''} onChange={(event) => handleInfoChange(session, event)} rows={3} />
            </label>
          </form>
        </article>
      ))}
    </section>
  );
};
