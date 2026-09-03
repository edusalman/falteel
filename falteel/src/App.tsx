// Caminho: ./src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Páginas importadas
import { Login } from './pages/Login';
import { Semestres } from './pages/Semestres';
import { Disciplinas } from './pages/Disciplinas';
import { Dashboard } from './pages/Dashboard';
import { Provas } from './pages/Provas';
import { Configuracoes } from './pages/Configuracoes';
import { AdminPanel } from './pages/AdminPanel';
import { Home } from './pages/Home'; // <- A Nova Home do Foco Diário

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota Pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas Protegidas (Alunos Comuns) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/semestres" element={<Semestres />} />
            <Route path="/disciplinas" element={<Disciplinas />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/provas" element={<Provas />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Rotas Protegidas (Apenas Admin) */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}