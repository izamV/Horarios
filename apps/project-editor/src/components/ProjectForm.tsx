import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { toDateInputValue } from '../utils/time';
import { useProjectStore } from '../state/projectStore';

export const ProjectForm: FC = () => {
  const project = useProjectStore((state) => state.project);
  const updateProjectDetails = useProjectStore((state) => state.updateProjectDetails);
  const updateCliente = useProjectStore((state) => state.updateCliente);
  const [localName, setLocalName] = useState(project?.nombre ?? '');
  const [localNotas, setLocalNotas] = useState(project?.notas ?? '');
  const [inicio, setInicio] = useState(project ? toDateInputValue(project.fechas.inicio) : '');
  const [fin, setFin] = useState(project ? toDateInputValue(project.fechas.fin) : '');
  const [clienteNombre, setClienteNombre] = useState(project?.cliente?.nombre ?? '');
  const [clienteEmail, setClienteEmail] = useState(project?.cliente?.email ?? '');
  const [clienteTelefono, setClienteTelefono] = useState(project?.cliente?.telefono ?? '');

  if (!project) {
    return <p className="notice">Crea o abre un proyecto para comenzar.</p>;
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateProjectDetails({
      nombre: localName,
      notas: localNotas,
      fechas: {
        inicio: new Date(`${inicio}T00:00:00`).toISOString(),
        fin: new Date(`${fin}T23:59:00`).toISOString()
      }
    });
    updateCliente({ nombre: clienteNombre, email: clienteEmail, telefono: clienteTelefono });
  };

  return (
    <form className="card grid" onSubmit={onSubmit} aria-label="Formulario del proyecto">
      <h2>Información general</h2>
      <label>
        Nombre del proyecto
        <input value={localName} onChange={(event) => setLocalName(event.target.value)} required />
      </label>
      <label>
        Notas
        <textarea value={localNotas} onChange={(event) => setLocalNotas(event.target.value)} rows={4} />
      </label>
      <div className="grid two">
        <label>
          Fecha de inicio
          <input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} required />
        </label>
        <label>
          Fecha de fin
          <input type="date" value={fin} onChange={(event) => setFin(event.target.value)} required />
        </label>
      </div>
      <hr />
      <h2>Cliente</h2>
      <div className="grid two">
        <label>
          Nombre
          <input value={clienteNombre} onChange={(event) => setClienteNombre(event.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={clienteEmail} onChange={(event) => setClienteEmail(event.target.value)} placeholder="cliente@correo.com" />
        </label>
      </div>
      <label>
        Teléfono
        <input value={clienteTelefono} onChange={(event) => setClienteTelefono(event.target.value)} placeholder="+34 600 000 000" />
      </label>
      <div className="controls-row">
        <button type="submit" className="primary">
          Guardar cambios
        </button>
      </div>
    </form>
  );
};
