import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {inicializarIndices} from './data/indicesRemotos';
import './index.css';

// Os índices têm de estar carregados ANTES de o App entrar no grafo de imports:
// módulos como WizardCalculator leem o último período disponível já no corpo do
// módulo. Daí a inicialização primeiro e o import dinâmico depois.
void (async () => {
  await inicializarIndices();
  const {default: App} = await import('./App');

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
})();
