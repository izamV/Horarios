import { describe, expect, it } from 'vitest';
import { aggregateMaterials, materialsToCSV } from '../materials';
import type { Project } from '../../domain/types';

const sampleProject: Project = {
  id: 'p1',
  nombre: 'Demo',
  notas: '',
  fechas: { inicio: new Date('2024-01-01T00:00:00Z').toISOString(), fin: new Date('2024-01-02T00:00:00Z').toISOString() },
  ubicaciones: [],
  cliente: { id: 'c1', nombre: 'Cliente Demo', rol: 'CLIENTE' },
  staff: [{ id: 's1', nombre: 'Staff 1', rol: 'STAFF' }],
  tareas: [],
  materiales: [
    { id: 'm1', nombre: 'Silla', unidad: 'unidad' },
    { id: 'm2', nombre: 'Mesa', unidad: 'unidad' }
  ],
  sesiones: [
    {
      id: 'session-1',
      ownerId: 'c1',
      ownerRol: 'CLIENTE',
      inicioISO: new Date('2024-01-01T09:00:00Z').toISOString(),
      finISO: new Date('2024-01-01T10:00:00Z').toISOString(),
      materiales: [
        { materialId: 'm1', cantidad: 5 }
      ]
    },
    {
      id: 'session-2',
      ownerId: 's1',
      ownerRol: 'STAFF',
      inicioISO: new Date('2024-01-01T09:00:00Z').toISOString(),
      finISO: new Date('2024-01-01T11:00:00Z').toISOString(),
      materiales: [
        { materialId: 'm1', cantidad: 2 },
        { materialId: 'm2', cantidad: 1 }
      ]
    }
  ],
  creadoAt: new Date().toISOString(),
  actualizadoAt: new Date().toISOString(),
  schemaVersion: 1
};

describe('aggregateMaterials', () => {
  it('sums quantities per material and person', () => {
    const result = aggregateMaterials(sampleProject);
    const silla = result.resumen.find((row) => row.materialId === 'm1');
    expect(silla?.cantidadTotal).toBe(7);
    expect(silla?.porPersona).toHaveLength(2);
  });

  it('exports csv format', () => {
    const csv = materialsToCSV(aggregateMaterials(sampleProject));
    expect(csv).toContain('Silla');
    expect(csv).toContain('Cliente Demo');
  });
});
