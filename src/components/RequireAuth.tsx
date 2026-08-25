/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/** Bloqueia o conteúdo (a plataforma, em `/app`) até haver sessão válida. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50/40 via-slate-50 to-blue-50/40"
        role="status"
        aria-live="polite"
      >
        <span className="font-sans text-sm text-slate-500">Verificando sua conta…</span>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  }

  return <>{children}</>;
}
