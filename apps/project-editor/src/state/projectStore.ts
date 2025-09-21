import { createStore } from '../adapters/state/store';
import { writeAutosave, readAutosave, clearAutosave } from '../adapters/storage/local';
import { createId } from '../adapters/uuid';
import type {
  Location,
  MaterialQty,
  MaterialType,
  Person,
  Project,
  Session,
  TaskType
} from '../domain/types';
import { createEmptyProject, touchProject, updateProjectCore } from '../core/project';
import {
  createSequentialSessions,
  ownerHasOverlap,
  removeSessionById,
  replaceSession,
  sortSessions,
  shiftSession as shiftSessionCore,
  updateSessionDuration
} from '../core/schedule';
import { deserializeProject, serializeProject } from '../core/serialization';

interface ProjectState {
  project: Project | null;
  autosaveLoaded: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: string | null;
  lastError: string | null;
  createProject: (payload: { nombre: string; inicio: string; fin: string }) => void;
  loadProject: (project: Project) => void;
  markSaved: () => void;
  resetProject: () => void;
  addLocation: (input: Omit<Location, 'id'> & { id?: string }) => Location | null;
  addTaskType: (input: Omit<TaskType, 'id'> & { id?: string }) => TaskType | null;
  addMaterialType: (input: Omit<MaterialType, 'id'> & { id?: string }) => MaterialType | null;
  addStaffMember: (input: Omit<Person, 'id' | 'rol'> & { id?: string }) => Person | null;
  updateCliente: (input: Partial<Person>) => void;
  updateProjectDetails: (input: {
    nombre?: string;
    notas?: string | null;
    fechas?: { inicio: string; fin: string };
  }) => void;
  appendSequentialSessions: (payload: {
    startISO: string;
    durations: number[];
    ownerId: string;
    ownerRol: Session['ownerRol'];
  }) => Session[];
  updateSession: (sessionId: string, changes: Partial<Session>) => Session | null;
  shiftSession: (sessionId: string, minutes: number) => Session | null;
  changeSessionDuration: (sessionId: string, minutes: number) => Session | null;
  removeSession: (sessionId: string) => void;
  setSessionMaterials: (sessionId: string, materials: MaterialQty[]) => Session | null;
}

const loadAutosaveProject = (): Project | null => {
  try {
    const raw = readAutosave();
    if (!raw) return null;
    return deserializeProject(raw);
  } catch (error) {
    console.warn('No se pudo cargar el autosave', error);
    return null;
  }
};

export const useProjectStore = createStore<ProjectState>((set, get) => {
  const autosavedProject = loadAutosaveProject();
  return {
    project: autosavedProject,
    autosaveLoaded: Boolean(autosavedProject),
    hasUnsavedChanges: false,
    lastSavedAt: null,
    lastError: null,
    createProject: ({ nombre, inicio, fin }) => {
      const project = createEmptyProject(nombre, inicio, fin);
      clearAutosave();
      set({ project, hasUnsavedChanges: true, lastError: null, autosaveLoaded: false });
    },
    loadProject: (project) => {
      clearAutosave();
      set({ project, hasUnsavedChanges: false, lastSavedAt: null, lastError: null, autosaveLoaded: false });
    },
    markSaved: () => {
      set({ hasUnsavedChanges: false, lastSavedAt: new Date().toISOString() });
    },
    resetProject: () => {
      clearAutosave();
      set({ project: null, hasUnsavedChanges: false, lastSavedAt: null, autosaveLoaded: false });
    },
    addLocation: (input) => {
      const state = get();
      if (!state.project) return null;
      const newLocation: Location = {
        id: input.id ?? createId(),
        nombre: input.nombre,
        lat: input.lat,
        lng: input.lng
      };
      const exists = state.project.ubicaciones.some((loc) => loc.nombre === newLocation.nombre);
      if (exists) {
        set({ lastError: 'Ya existe una ubicación con ese nombre' });
        return null;
      }
      const project = updateProjectCore(state.project, {
        ubicaciones: [...state.project.ubicaciones, newLocation]
      });
      set({ project, hasUnsavedChanges: true, lastError: null });
      return newLocation;
    },
    addTaskType: (input) => {
      const state = get();
      if (!state.project) return null;
      const newTask: TaskType = {
        id: input.id ?? createId(),
        nombre: input.nombre,
        requiereSubtareas: input.requiereSubtareas,
        defaultMaterials: input.defaultMaterials?.map((m) => ({ ...m }))
      };
      const exists = state.project.tareas.some((task) => task.nombre === newTask.nombre);
      if (exists) {
        set({ lastError: 'Ya existe una tarea con ese nombre' });
        return null;
      }
      const project = updateProjectCore(state.project, {
        tareas: [...state.project.tareas, newTask]
      });
      set({ project, hasUnsavedChanges: true, lastError: null });
      return newTask;
    },
    addMaterialType: (input) => {
      const state = get();
      if (!state.project) return null;
      const newMaterial: MaterialType = {
        id: input.id ?? createId(),
        nombre: input.nombre,
        unidad: input.unidad
      };
      const exists = state.project.materiales.some((material) => material.nombre === newMaterial.nombre);
      if (exists) {
        set({ lastError: 'Ya existe un material con ese nombre' });
        return null;
      }
      const project = updateProjectCore(state.project, {
        materiales: [...state.project.materiales, newMaterial]
      });
      set({ project, hasUnsavedChanges: true, lastError: null });
      return newMaterial;
    },
    addStaffMember: (input) => {
      const state = get();
      if (!state.project) return null;
      const newStaff: Person = {
        id: input.id ?? createId(),
        nombre: input.nombre,
        email: input.email,
        telefono: input.telefono,
        rol: 'STAFF'
      };
      const project = updateProjectCore(state.project, {
        staff: [...state.project.staff, newStaff]
      });
      set({ project, hasUnsavedChanges: true, lastError: null });
      return newStaff;
    },
    updateCliente: (input) => {
      const state = get();
      if (!state.project || !state.project.cliente) return;
      const cliente = { ...state.project.cliente, ...input };
      const project = updateProjectCore(state.project, { cliente });
      set({ project, hasUnsavedChanges: true, lastError: null });
    },
    updateProjectDetails: (input) => {
      const state = get();
      if (!state.project) return;
      const project = updateProjectCore(state.project, {
        nombre: input.nombre ?? state.project.nombre,
        notas: input.notas ?? state.project.notas,
        fechas: input.fechas ?? state.project.fechas
      });
      set({ project, hasUnsavedChanges: true, lastError: null });
    },
    appendSequentialSessions: ({ startISO, durations, ownerId, ownerRol }) => {
      const state = get();
      if (!state.project) return [];
      const newSessions = createSequentialSessions({ startISO, durations, ownerId, ownerRol });
      const combined = [...state.project.sesiones];
      for (const session of newSessions) {
        if (ownerHasOverlap(combined, session)) {
          set({ lastError: 'Los segmentos se solapan con el horario existente' });
          return [];
        }
        combined.push(session);
      }
      const project = touchProject({
        ...state.project,
        sesiones: sortSessions(combined)
      });
      set({ project, hasUnsavedChanges: true, lastError: null });
      return newSessions;
    },
    updateSession: (sessionId, changes) => {
      const state = get();
      if (!state.project) return null;
      const target = state.project.sesiones.find((session) => session.id === sessionId);
      if (!target) return null;
      const updated: Session = {
        ...target,
        ...changes,
        materiales: changes.materiales ?? target.materiales
      };
      const others = state.project.sesiones.filter((session) => session.id !== sessionId);
      if (ownerHasOverlap(others, updated)) {
        set({ lastError: 'El segmento se solapa con otro existente' });
        return null;
      }
      const project = touchProject({
        ...state.project,
        sesiones: sortSessions(replaceSession(state.project.sesiones, updated))
      });
      set({ project, hasUnsavedChanges: true, lastError: null });
      return updated;
    },
    shiftSession: (sessionId, minutes) => {
      const state = get();
      if (!state.project) return null;
      const target = state.project.sesiones.find((session) => session.id === sessionId);
      if (!target) return null;
      const shifted = shiftSessionCore(target, minutes);
      return get().updateSession(sessionId, shifted);
    },
    changeSessionDuration: (sessionId, minutes) => {
      const state = get();
      if (!state.project) return null;
      const target = state.project.sesiones.find((session) => session.id === sessionId);
      if (!target) return null;
      const updated = updateSessionDuration(target, minutes);
      return get().updateSession(sessionId, updated);
    },
    removeSession: (sessionId) => {
      const state = get();
      if (!state.project) return;
      const project = touchProject({
        ...state.project,
        sesiones: removeSessionById(state.project.sesiones, sessionId)
      });
      set({ project, hasUnsavedChanges: true, lastError: null });
    },
    setSessionMaterials: (sessionId, materials) => {
      const state = get();
      if (!state.project) return null;
      return get().updateSession(sessionId, { materiales: materials });
    }
  };
});

useProjectStore.subscribe((state) => {
  if (!state.project) {
    clearAutosave();
    return;
  }
  writeAutosave(serializeProject(state.project));
});
