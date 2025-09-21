const STORAGE_KEY = 'project-editor:autosave';

export const readAutosave = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEY);
};

export const writeAutosave = (value: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, value);
};

export const clearAutosave = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
};

export const storageKey = STORAGE_KEY;
