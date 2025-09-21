import type { FC } from 'react';
import { useState } from 'react';
import { useProjectStore } from '../state/projectStore';
import { ScheduleEditor } from './ScheduleEditor';

export const StaffManager: FC = () => {
  const project = useProjectStore((state) => state.project);
  const addStaffMember = useProjectStore((state) => state.addStaffMember);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!project) {
    return <p className="notice">Crea un proyecto antes de añadir staff.</p>;
  }

  const handleAddMember = () => {
    const nombre = window.prompt('Nombre del miembro del staff');
    if (!nombre) return;
    const email = window.prompt('Correo electrónico (opcional)') ?? undefined;
    const telefono = window.prompt('Teléfono (opcional)') ?? undefined;
    const created = addStaffMember({ nombre, email, telefono });
    if (created) {
      setExpandedId(created.id);
    }
  };

  const staffSessionsCount = (staffId: string) => project.sesiones.filter((session) => session.ownerId === staffId).length;

  return (
    <section className="grid">
      <div className="controls-row">
        <button type="button" className="primary" onClick={handleAddMember}>
          Añadir miembro
        </button>
      </div>
      {project.staff.length === 0 && <p>No hay miembros de staff añadidos todavía.</p>}
      {project.staff.map((member) => {
        const sessionsCount = staffSessionsCount(member.id);
        return (
          <details
            key={member.id}
            open={expandedId === member.id}
            onToggle={(event) => {
              if ((event.target as HTMLDetailsElement).open) {
                setExpandedId(member.id);
              } else if (expandedId === member.id) {
                setExpandedId(null);
              }
            }}
            className="card"
          >
            <summary className="controls-row">
              <span>{member.nombre}</span>
              <span className={`badge ${sessionsCount > 0 ? 'success' : 'warning'}`}>
                {sessionsCount > 0 ? 'Horario completo' : 'Horario incompleto'}
              </span>
            </summary>
            <ScheduleEditor ownerId={member.id} ownerRol="STAFF" ownerNombre={member.nombre} />
          </details>
        );
      })}
    </section>
  );
};
