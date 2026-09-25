import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import './index.css';
import { reloadOnceForNewVersion } from './utils/chunkErrors';

// Vite avisa con este evento cuando no puede precargar un archivo de la app
// (normalmente porque se publicó una versión nueva): recargar una vez para obtenerla.
window.addEventListener('vite:preloadError', (event) => {
  if (navigator.onLine && reloadOnceForNewVersion()) event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary variant="page">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
