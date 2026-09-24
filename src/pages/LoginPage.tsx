/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import LayoutAuth from '../components/LayoutAuth';
import FormularioLogin from '../components/FormularioLogin';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { de?: string } | null)?.de ?? '/app';

  return (
    <LayoutAuth titulo="Entrar">
      <FormularioLogin
        aoEntrar={() => navigate(destino, { replace: true })}
        rodape={
          <p className="text-xs text-slate-500 text-center">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-cyan-700 font-semibold hover:underline">
              Cadastre-se
            </Link>
          </p>
        }
      />
    </LayoutAuth>
  );
}
