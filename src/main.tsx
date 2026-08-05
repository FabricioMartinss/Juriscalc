import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import HomePage from './pages/HomePage';
import {inicializarIndices} from './data/indicesRemotos';
import './index.css';

/**
 * A plataforma é carregada sob demanda, e os índices são buscados ANTES de o
 * módulo entrar no grafo de imports: componentes como o WizardCalculator leem o
 * último período disponível já no corpo do módulo.
 *
 * Fazer isso aqui, e não no bootstrap, mantém a homepage instantânea — ela é a
 * porta de entrada pública e não depende de índice nenhum.
 */
const Plataforma = lazy(async () => {
  await inicializarIndices();
  return import('./App');
});

function Carregando() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50/40 via-slate-50 to-blue-50/40"
      role="status"
      aria-live="polite"
    >
      <span className="font-sans text-sm text-slate-500">Carregando a plataforma…</span>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/app"
          element={
            <Suspense fallback={<Carregando />}>
              <Plataforma />
            </Suspense>
          }
        />
        {/* Qualquer outro caminho volta para a porta de entrada. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
