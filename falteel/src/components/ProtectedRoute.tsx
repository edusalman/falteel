// Caminho: ./src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { useNotificacoes } from '../hooks/useNotificacoes';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
}

export function ProtectedRoute({ requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading } = useAuth();

  // Roda em qualquer tela autenticada; a própria função decide se checa algo
  useNotificacoes();

  // Tela de loading Neobrutalista enquanto checa o Supabase
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neo-yellow">
        <div className="card-brutal text-2xl font-bold animate-pulse">
          CARREGANDO...
        </div>
      </div>
    );
  }

  // Se não tem usuário logado, manda pro login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se a rota exige admin e o usuário comum tentar acessar, joga pra Home
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Se passou em tudo, renderiza a tela solicitada
  return <Outlet />;
}