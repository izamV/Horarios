import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';

declare global {
  interface WindowEventMap {
    'project-editor:new-project': CustomEvent;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento raíz');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
