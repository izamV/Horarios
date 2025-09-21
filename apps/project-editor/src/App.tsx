import { useEffect, useMemo, useRef, useState } from 'react';
import { FileMenu } from './components/FileMenu';
import { ProjectForm } from './components/ProjectForm';
import { ScheduleEditor } from './components/ScheduleEditor';
import { StaffManager } from './components/StaffManager';
import { GanttView } from './components/GanttView';
import { MaterialsView } from './components/MaterialsView';
import { MapView } from './components/MapView';
import { Wizard } from './components/Wizard';
import { useProjectStore } from './state/projectStore';
import { openFileDialog } from './adapters/file/upload';
import { downloadFile } from './adapters/file/download';
import { deserializeProject, serializeProject } from './core/serialization';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const RESULTS_TABS = [
  { id: 'gantt', label: 'Horarios' },
  { id: 'materials', label: 'Materiales' },
  { id: 'map', label: 'Mapa' }
] as const;

export default function App() {
  const project = useProjectStore((state) => state.project);
  const createProject = useProjectStore((state) => state.createProject);
  const loadProject = useProjectStore((state) => state.loadProject);
  const hasUnsavedChanges = useProjectStore((state) => state.hasUnsavedChanges);
  const markSaved = useProjectStore((state) => state.markSaved);
  const resetProject = useProjectStore((state) => state.resetProject);
  const lastSavedAt = useProjectStore((state) => state.lastSavedAt);
  const autosaveLoaded = useProjectStore((state) => state.autosaveLoaded);

  const [currentStep, setCurrentStep] = useState<'home' | 'project' | 'client' | 'staff' | 'results'>('home');
  const [resultsTab, setResultsTab] = useState<typeof RESULTS_TABS[number]['id']>('gantt');
  const [zoom, setZoom] = useState(1);
  const togglePlayRef = useRef<() => void>();

  const goToStep = (step: typeof currentStep) => setCurrentStep(step);

  const confirmDiscard = () => {
    if (!project || !hasUnsavedChanges) return true;
    return window.confirm('Hay cambios sin guardar. ¿Deseas continuar y descartar los cambios?');
  };

  const handleNewProject = () => {
    if (!confirmDiscard()) return;
    const nombre = window.prompt('Nombre del proyecto');
    if (!nombre) return;
    const defaultDate = new Date().toISOString().slice(0, 10);
    const inicio = window.prompt('Fecha de inicio (YYYY-MM-DD)', defaultDate) ?? defaultDate;
    const fin = window.prompt('Fecha de fin (YYYY-MM-DD)', defaultDate) ?? defaultDate;
    createProject({ nombre, inicio: new Date(`${inicio}T00:00:00`).toISOString(), fin: new Date(`${fin}T23:59:00`).toISOString() });
    setCurrentStep('project');
  };

  const handleOpenProject = async () => {
    if (!confirmDiscard()) return;
    const contents = await openFileDialog();
    if (!contents) return;
    try {
      const parsed = deserializeProject(contents);
      loadProject(parsed);
      setCurrentStep('project');
    } catch (error) {
      window.alert('No se pudo cargar el archivo. Asegúrate de que es un .eventplan.json válido.');
      console.error(error);
    }
  };

  const handleSaveAs = () => {
    if (!project) return;
    const json = serializeProject(project);
    downloadFile(`${project.nombre}.eventplan.json`, json);
    markSaved();
  };

  const handleReset = () => {
    if (!confirmDiscard()) return;
    resetProject();
    setCurrentStep('home');
  };

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [hasUnsavedChanges]);

  useKeyboardShortcuts({
    onSave: handleSaveAs,
    onOpen: handleOpenProject,
    onNew: handleNewProject,
    onTogglePlay: () => togglePlayRef.current?.(),
    onZoomIn: () => setZoom((prev) => Math.min(4, prev + 0.25)),
    onZoomOut: () => setZoom((prev) => Math.max(0.5, prev - 0.25))
  });

  const steps = useMemo(() => {
    return [
      {
        id: 'project',
        label: 'Proyecto',
        content: <ProjectForm />,
        disabled: !project
      },
      {
        id: 'client',
        label: 'Cliente',
        content: project && project.cliente ? (
          <ScheduleEditor ownerId={project.cliente.id} ownerRol="CLIENTE" ownerNombre={project.cliente.nombre} />
        ) : (
          <p className="notice">Configura la información del cliente primero.</p>
        ),
        disabled: !project
      },
      {
        id: 'staff',
        label: 'Staff',
        content: <StaffManager />,
        disabled: !project
      },
      {
        id: 'results',
        label: 'Resultados',
        content: (
          <section className="grid">
            <nav className="tab-bar" role="tablist">
              {RESULTS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  className={`tab-button ${resultsTab === tab.id ? 'active' : ''}`}
                  aria-selected={resultsTab === tab.id}
                  onClick={() => setResultsTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            {resultsTab === 'gantt' && <GanttView zoom={zoom} onZoomChange={setZoom} />}
            {resultsTab === 'materials' && <MaterialsView />}
            {resultsTab === 'map' && <MapView registerTogglePlay={(toggle) => (togglePlayRef.current = toggle)} />}
          </section>
        ),
        disabled: !project
      }
    ];
  }, [project, resultsTab, zoom]);

  const showHome = currentStep === 'home' || !project;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Editor de proyectos</h1>
        <FileMenu
          onNew={handleNewProject}
          onOpen={handleOpenProject}
          onSaveAs={handleSaveAs}
          hasProject={Boolean(project)}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
        />
        {project && (
          <button type="button" className="ghost" onClick={handleReset}>
            Volver al inicio
          </button>
        )}
      </header>
      <main className="app-main">
        {autosaveLoaded && project && (
          <p className="notice">Se restauró un borrador guardado automáticamente.</p>
        )}
        {showHome ? (
          <section className="grid">
            <div className="home-grid">
              <article className="home-card">
                <h2>Nuevo proyecto</h2>
                <p>Configura un nuevo evento desde cero.</p>
                <button type="button" className="primary" onClick={handleNewProject}>
                  Nuevo
                </button>
              </article>
              <article className="home-card">
                <h2>Abrir proyecto</h2>
                <p>Importa un archivo .eventplan.json existente.</p>
                <button type="button" className="ghost" onClick={handleOpenProject}>
                  Abrir…
                </button>
              </article>
              <article className="home-card">
                <h2>Continuar</h2>
                <p>Accede al asistente para seguir editando el proyecto actual.</p>
                <button type="button" className="ghost" onClick={() => goToStep('project')} disabled={!project}>
                  Ir al asistente
                </button>
              </article>
            </div>
          </section>
        ) : (
          <Wizard steps={steps} currentStep={currentStep === 'home' ? 'project' : currentStep} onStepChange={(id) => setCurrentStep(id as typeof currentStep)} />
        )}
      </main>
    </div>
  );
}
