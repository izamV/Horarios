import type { FC } from 'react';
import { useMemo } from 'react';
import { useProjectStore } from '../state/projectStore';
import { aggregateMaterials, materialsToCSV } from '../core/materials';
import { downloadFile } from '../adapters/file/download';

export const MaterialsView: FC = () => {
  const project = useProjectStore((state) => state.project);

  const aggregation = useMemo(() => (project ? aggregateMaterials(project) : { resumen: [] }), [project]);

  if (!project) {
    return <p className="notice">Crea un proyecto para ver el resumen de materiales.</p>;
  }

  return (
    <section className="card">
      <header className="controls-row">
        <h3>Materiales agregados</h3>
        <button
          type="button"
          className="ghost"
          onClick={() => downloadFile(`${project.nombre}.materiales.csv`, materialsToCSV(aggregation))}
          disabled={aggregation.resumen.length === 0}
        >
          Exportar CSV
        </button>
      </header>
      {aggregation.resumen.length === 0 ? (
        <p>No hay materiales asignados en las sesiones.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Unidad</th>
              <th>Total</th>
              <th>Persona</th>
              <th>Rol</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {aggregation.resumen.flatMap((row) => (
              row.porPersona.length > 0
                ? row.porPersona.map((persona, index) => (
                    <tr key={`${row.materialId}-${persona.ownerId}-${index}`}>
                      <td>{index === 0 ? row.nombre : ''}</td>
                      <td>{index === 0 ? row.unidad : ''}</td>
                      <td>{index === 0 ? row.cantidadTotal : ''}</td>
                      <td>{persona.ownerNombre}</td>
                      <td>{persona.ownerRol}</td>
                      <td>{persona.cantidad}</td>
                    </tr>
                  ))
                : (
                    <tr key={`${row.materialId}-total`}>
                      <td>{row.nombre}</td>
                      <td>{row.unidad}</td>
                      <td>{row.cantidadTotal}</td>
                      <td colSpan={3}>Sin asignar a personas específicas</td>
                    </tr>
                  )
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
