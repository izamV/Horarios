import { describe, expect, it } from 'vitest';
import { deserializeProject, serializeProject } from '../serialization';
import type { Project } from '../../domain/types';

const project: Project = {
  id: 'project-1',
  nombre: 'Evento',
  notas: 'Notas',
  fechas: { inicio: new Date('2024-03-01T00:00:00Z').toISOString(), fin: new Date('2024-03-02T00:00:00Z').toISOString() },
  ubicaciones: [{ id: 'l1', nombre: 'Sala A' }],
  cliente: { id: 'cliente-1', nombre: 'Cliente', rol: 'CLIENTE' },
  staff: [],
  tareas: [],
  sesiones: [],
  materiales: [],
  creadoAt: new Date().toISOString(),
  actualizadoAt: new Date().toISOString(),
  schemaVersion: 1
};

describe('serialization', () => {
  it('roundtrips project data without loss', () => {
    const json = serializeProject(project);
    const parsed = deserializeProject(json);
    expect(parsed).toEqual(project);
  });
});
