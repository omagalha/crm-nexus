import {
  BarChart3,
  Building2,
  CheckSquare,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import NexusSymbol from './NexusSymbol.jsx';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', path: '/leads', icon: UsersRound },
  { label: 'Municípios', path: '/municipios', icon: Building2 },
  { label: 'Contatos', path: '/contatos', icon: MessagesSquare },
  { label: 'Pipeline', path: '/pipeline', icon: SlidersHorizontal },
  { label: 'Propostas', path: '/propostas', icon: FileText },
  { label: 'Tarefas', path: '/tarefas', icon: CheckSquare },
  { label: 'Relatórios', path: '/relatorios', icon: BarChart3 },
  { label: 'Configurações', path: '/configuracoes', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <NavLink className="brand" to="/dashboard" onClick={onClose}>
          <span className="brand-mark">
            <NexusSymbol size={22} color="white" />
          </span>
          <div>
            <strong>Nexus</strong>
            <small>Educação CRM</small>
          </div>
        </NavLink>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} onClick={onClose}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <button
        className={`sidebar-backdrop ${open ? 'is-visible' : ''}`}
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
      />
    </>
  );
}
