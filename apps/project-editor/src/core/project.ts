import { nowISO } from '../adapters/datetime';
import { createId } from '../adapters/uuid';
import type { Person, Project } from '../domain/types';
import { schemaVersion } from '../domain/types';

export const createEmptyProject = (nombre: string, inicio: string, fin: string): Project => {
  const id = createId();
  const cliente: Person = {
    id: createId(),
    nombre: 'Cliente principal',
    rol: 'CLIENTE'
  };

  const timestamp = nowISO();

  return {
    id,
    nombre,
    notas: '',
    fechas: { inicio, fin },
    ubicaciones: [],
    cliente,
    staff: [],
    tareas: [],
    sesiones: [],
    materiales: [],
    creadoAt: timestamp,
    actualizadoAt: timestamp,
    schemaVersion
  };
};

export const touchProject = (project: Project): Project => ({
  ...project,
  actualizadoAt: nowISO()
});

export const updateProjectCore = <T extends Partial<Project>>(project: Project, patch: T): Project => (
  touchProject({ ...project, ...patch })
);
