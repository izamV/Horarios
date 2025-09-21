import type { Project } from '../domain/types';

export interface MaterialAggregationRow {
  materialId: string;
  nombre: string;
  unidad: string;
  cantidadTotal: number;
  porPersona: Array<{
    ownerId: string;
    ownerRol: 'CLIENTE' | 'STAFF';
    ownerNombre: string;
    cantidad: number;
  }>;
}

export interface MaterialAggregationResult {
  resumen: MaterialAggregationRow[];
}

export const aggregateMaterials = (project: Project): MaterialAggregationResult => {
  const materialCatalog = new Map(project.materiales.map((material) => [material.id, material]));
  const ownerCatalog = new Map<string, { nombre: string; rol: 'CLIENTE' | 'STAFF' }>();
  if (project.cliente) {
    ownerCatalog.set(project.cliente.id, { nombre: project.cliente.nombre, rol: 'CLIENTE' });
  }
  project.staff.forEach((persona) => ownerCatalog.set(persona.id, { nombre: persona.nombre, rol: 'STAFF' }));

  const rows = new Map<string, MaterialAggregationRow>();

  project.sesiones.forEach((session) => {
    const owner = ownerCatalog.get(session.ownerId);
    if (!owner) return;
    session.materiales?.forEach((materialQty) => {
      const catalogEntry = materialCatalog.get(materialQty.materialId);
      const nombre = catalogEntry?.nombre ?? 'Material sin nombre';
      const unidad = catalogEntry?.unidad ?? '';
      const existing = rows.get(materialQty.materialId) ?? {
        materialId: materialQty.materialId,
        nombre,
        unidad,
        cantidadTotal: 0,
        porPersona: [] as MaterialAggregationRow['porPersona']
      };
      existing.cantidadTotal += materialQty.cantidad;
      const personaRow = existing.porPersona.find((row) => row.ownerId === session.ownerId);
      if (personaRow) {
        personaRow.cantidad += materialQty.cantidad;
      } else {
        existing.porPersona.push({
          ownerId: session.ownerId,
          ownerRol: owner.rol,
          ownerNombre: owner.nombre,
          cantidad: materialQty.cantidad
        });
      }
      rows.set(materialQty.materialId, existing);
    });
  });

  return { resumen: Array.from(rows.values()) };
};

export const materialsToCSV = (aggregation: MaterialAggregationResult): string => {
  const header = ['Material', 'Unidad', 'Total', 'Persona', 'Rol', 'Cantidad'];
  const lines = [header.join(',')];
  aggregation.resumen.forEach((row) => {
    if (row.porPersona.length === 0) {
      lines.push([row.nombre, row.unidad, String(row.cantidadTotal), '', '', '0'].join(','));
    }
    row.porPersona.forEach((persona) => {
      lines.push([
        row.nombre,
        row.unidad,
        String(row.cantidadTotal),
        persona.ownerNombre,
        persona.ownerRol,
        String(persona.cantidad)
      ].join(','));
    });
  });
  return lines.join('\n');
};
