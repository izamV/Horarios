import { useEffect } from 'react';

interface Handlers {
  onSave?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onTogglePlay?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export const useKeyboardShortcuts = (handlers: Handlers) => {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const isCtrl = event.ctrlKey || event.metaKey;
      if (isCtrl && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handlers.onSave?.();
      }
      if (isCtrl && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        handlers.onOpen?.();
      }
      if (isCtrl && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        handlers.onNew?.();
      }
      if (event.code === 'Space') {
        event.preventDefault();
        handlers.onTogglePlay?.();
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handlers.onZoomIn?.();
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        handlers.onZoomOut?.();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handlers]);
};
