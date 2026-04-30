import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { logout } from '../services/authService.js';

function initials(nome) {
  if (!nome) return 'NX';
  return nome.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

const PERFIL_LABEL = {
  administrador:  'Administrador',
  diretor:        'Diretor',
  comercial:      'Comercial',
  administrativo: 'Administrativo',
  consulta:       'Consulta',
};

export default function Header({ onMenuClick }) {
  const { perfil } = useAuth();
  const nome = perfil?.nome || 'Usuário';
  const cargo = PERFIL_LABEL[perfil?.perfil] ?? '';

  async function handleLogout() {
    await logout();
  }

  return (
    <header className="app-header">
      <button className="icon-button mobile-menu" type="button" onClick={onMenuClick} aria-label="Abrir menu">
        <Menu size={20} />
      </button>

      <label className="search-box">
        <Search size={18} />
        <input type="search" placeholder="Buscar lead, município ou proposta" />
      </label>

      <div className="header-actions">
        <button className="icon-button" type="button" aria-label="Notificações">
          <Bell size={19} />
        </button>

        <div className="user-chip">
          <span>{initials(nome)}</span>
          <div>
            <strong>{nome}</strong>
            <small>{cargo}</small>
          </div>
        </div>

        <button className="icon-button" type="button" onClick={handleLogout} aria-label="Sair">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
