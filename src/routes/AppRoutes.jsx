import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Leads from '../pages/Leads.jsx';
import LeadDetails from '../pages/LeadDetails.jsx';
import LeadForm from '../pages/LeadForm.jsx';
import Propostas from '../pages/Propostas.jsx';
import Municipios from '../pages/Municipios.jsx';
import Contatos from '../pages/Contatos.jsx';
import Tarefas from '../pages/Tarefas.jsx';
import Relatorios from '../pages/Relatorios.jsx';
import Configuracoes from '../pages/Configuracoes.jsx';
import Login from '../pages/Login.jsx';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-symbol">
        <span />
        <span />
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;
  return <MainLayout />;
}

function PublicRoute() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/novo" element={<LeadForm />} />
        <Route path="/leads/:leadId/editar" element={<LeadForm />} />
        <Route path="/leads/:leadId" element={<LeadDetails />} />
        <Route path="/municipios" element={<Municipios />} />
        <Route path="/contatos" element={<Contatos />} />
        <Route path="/pipeline" element={<Leads />} />
        <Route path="/propostas" element={<Propostas />} />
        <Route path="/tarefas" element={<Tarefas />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
