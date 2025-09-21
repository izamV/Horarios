import type { FC } from 'react';

interface Props {
  onNew: () => void;
  onOpen: () => void;
  onSaveAs: () => void;
  hasProject: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt?: string | null;
}

export const FileMenu: FC<Props> = ({ onNew, onOpen, onSaveAs, hasProject, hasUnsavedChanges, lastSavedAt }) => {
  return (
    <div className="controls-row" role="menubar" aria-label="Menú de archivo">
      <button type="button" onClick={onNew} className="primary">
        Nuevo
      </button>
      <button type="button" onClick={onOpen} className="ghost">
        Abrir…
      </button>
      <button type="button" onClick={onSaveAs} className="ghost" disabled={!hasProject} aria-disabled={!hasProject}>
        Guardar como…
      </button>
      {hasProject && (
        <span aria-live="polite">
          {hasUnsavedChanges ? (
            <span className="badge warning">Cambios sin guardar</span>
          ) : (
            <span className="badge success">
              Guardado {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString('es-ES') : 'recientemente'}
            </span>
          )}
        </span>
      )}
    </div>
  );
};
