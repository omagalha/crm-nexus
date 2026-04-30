import { Calendar, KeyRound, Mail, Save, Shield, User, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  connectCalendar,
  disconnectCalendar,
  isCalendarConnected,
  onCalendarConnectionChange,
} from '../services/googleCalendarService.js';
import { convidarMembro, getEquipe, toggleMembroAtivo, updateMembroRole } from '../services/equipeService.js';
import { supabase } from '../services/supabase.js';

const PERFIL_LABEL = {
  administrador:  'Administrador',
  diretor:        'Diretor',
  comercial:      'Comercial',
  administrativo: 'Administrativo',
  consulta:       'Consulta',
};

const ROLES = [
  { value: 'diretor',        label: 'Diretor',        desc: 'Acesso total ao sistema, incluindo convite de membros.' },
  { value: 'administrador',  label: 'Administrador',  desc: 'Acesso total ao sistema, incluindo convite de membros.' },
  { value: 'comercial',      label: 'Comercial',      desc: 'Cadastra leads, registra interações e acompanha oportunidades.' },
  { value: 'administrativo', label: 'Administrativo', desc: 'Acompanha propostas, documentos, contratos e notas.' },
  { value: 'consulta',       label: 'Consulta',       desc: 'Apenas visualiza informações.' },
];

export default function Configuracoes() {
  const { perfil, session, updatePerfil } = useAuth();
  const showToast = useToast();
  const isDiretor = perfil?.perfil === 'diretor';
  const isAdmin   = isDiretor || perfil?.perfil === 'administrador';

  // perfil
  const [nome, setNome] = useState(perfil?.nome ?? '');
  const [savingNome, setSavingNome] = useState(false);

  // senha
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaConfirm, setSenhaConfirm] = useState('');
  const [savingSenha, setSavingSenha] = useState(false);
  const [senhaError, setSenhaError] = useState('');

  // equipe (admin only)
  const [equipe, setEquipe] = useState([]);
  const [loadingEquipe, setLoadingEquipe] = useState(false);
  const [equipeError, setEquipeError] = useState('');

  // Google Calendar
  const [calConnected, setCalConnected] = useState(isCalendarConnected);

  useEffect(() => {
    onCalendarConnectionChange((connected) => {
      setCalConnected(connected);
      if (connected) showToast('Google Calendar conectado!');
    });
  }, []);

  function handleConnectCalendar() {
    try {
      connectCalendar();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleDisconnectCalendar() {
    disconnectCalendar();
  }

  // convite
  const [emailConvite, setEmailConvite] = useState('');
  const [sendingConvite, setSendingConvite] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingEquipe(true);
    getEquipe()
      .then(setEquipe)
      .catch((err) => setEquipeError(err.message || 'Não foi possível carregar a equipe.'))
      .finally(() => setLoadingEquipe(false));
  }, [isAdmin]);

  async function handleRoleChange(userId, role) {
    try {
      await updateMembroRole(userId, role);
      setEquipe((cur) => cur.map((m) => m.id === userId ? { ...m, perfil: role } : m));
      showToast('Papel atualizado com sucesso.', 'success');
    } catch (err) {
      showToast(err.message || 'Não foi possível atualizar o papel.', 'error');
    }
  }

  async function handleToggleAtivo(userId, ativo) {
    try {
      await toggleMembroAtivo(userId, !ativo);
      setEquipe((cur) => cur.map((m) => m.id === userId ? { ...m, ativo: !ativo } : m));
    } catch (err) {
      alert(err.message || 'Não foi possível alterar o status.');
    }
  }

  async function handleConvite(e) {
    e.preventDefault();
    if (!emailConvite.trim()) return;
    setSendingConvite(true);
    try {
      await convidarMembro(emailConvite.trim());
      showToast(`Convite enviado para ${emailConvite.trim()}.`);
      setEmailConvite('');
    } catch (err) {
      showToast(err.message || 'Não foi possível enviar o convite.', 'error');
    } finally {
      setSendingConvite(false);
    }
  }

  async function handleSaveNome(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSavingNome(true);
    try {
      await updatePerfil({ nome: nome.trim() });
      showToast('Nome atualizado com sucesso.');
    } catch (err) {
      showToast(err.message || 'Não foi possível salvar.', 'error');
    } finally {
      setSavingNome(false);
    }
  }

  async function handleSaveSenha(e) {
    e.preventDefault();
    setSenhaError('');
    if (senhaNova.length < 6) {
      setSenhaError('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (senhaNova !== senhaConfirm) {
      setSenhaError('As senhas não coincidem.');
      return;
    }
    setSavingSenha(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senhaNova });
      if (error) throw error;
      showToast('Senha alterada com sucesso.');
      setSenhaNova('');
      setSenhaConfirm('');
    } catch (err) {
      setSenhaError(err.message || 'Não foi possível alterar a senha.');
    } finally {
      setSavingSenha(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span>Conta</span>
          <h1>Configurações</h1>
          <p>Gerencie seu perfil, credenciais e equipe de acesso.</p>
        </div>
      </section>

      {/* Perfil + Senha */}
      <div className="config-grid">
        <article className="panel">
          <div className="panel-header">
            <div><span>Identidade</span><h2><User size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Perfil</h2></div>
          </div>
          <form onSubmit={handleSaveNome} className="config-form">
            <label>
              Nome de exibição
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" required />
            </label>
            <label>
              E-mail
              <input value={session?.user?.email ?? ''} disabled />
            </label>
            <label>
              Nível de acesso
              <input value={PERFIL_LABEL[perfil?.perfil] ?? perfil?.perfil ?? '—'} disabled />
            </label>
            <div className="form-actions">
              <Button type="submit" disabled={savingNome}>
                <Save size={16} />
                {savingNome ? 'Salvando…' : 'Salvar nome'}
              </Button>
            </div>
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div><span>Segurança</span><h2><KeyRound size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Alterar senha</h2></div>
          </div>
          <form onSubmit={handleSaveSenha} className="config-form">
            <label>
              Nova senha
              <input type="password" value={senhaNova} onChange={(e) => setSenhaNova(e.target.value)} placeholder="Mínimo 6 caracteres" required />
            </label>
            <label>
              Confirmar nova senha
              <input type="password" value={senhaConfirm} onChange={(e) => setSenhaConfirm(e.target.value)} placeholder="Repita a nova senha" required />
            </label>
            {senhaError && <div className="config-msg config-msg-err">{senhaError}</div>}
            <div className="form-actions">
              <Button type="submit" disabled={savingSenha}>
                <KeyRound size={16} />
                {savingSenha ? 'Salvando…' : 'Alterar senha'}
              </Button>
            </div>
          </form>
        </article>
      </div>

      {/* Convite — Diretor e Administrador */}
      {isAdmin && (
        <article className="panel">
          <div className="panel-header">
            <div><span>Administração</span><h2><Mail size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Convidar membro</h2></div>
          </div>
          <form onSubmit={handleConvite} className="convite-form">
            <label>
              E-mail do novo membro
              <input
                type="email"
                value={emailConvite}
                onChange={(e) => setEmailConvite(e.target.value)}
                placeholder="nome@dominio.com.br"
                required
              />
            </label>
            <p className="convite-hint">
              O Supabase enviará um link de acesso para o e-mail informado. Após o primeiro login, defina o papel da pessoa na lista da equipe abaixo.
            </p>
            <div className="form-actions">
              <Button type="submit" disabled={sendingConvite}>
                <Mail size={16} />
                {sendingConvite ? 'Enviando…' : 'Enviar convite'}
              </Button>
            </div>
          </form>
        </article>
      )}

      {/* Integrações */}
      <article className="panel">
        <div className="panel-header">
          <div>
            <span>Produtividade</span>
            <h2><Calendar size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Google Calendar</h2>
          </div>
        </div>
        <div className="integracao-body">
          <div className="integracao-status">
            <span className={`integracao-dot ${calConnected ? 'is-connected' : ''}`} />
            <span>{calConnected ? 'Conectado — próximas ações serão sincronizadas automaticamente.' : 'Desconectado — conecte para sincronizar próximas ações com sua agenda.'}</span>
          </div>
          <div className="form-actions">
            {calConnected ? (
              <Button type="button" onClick={handleDisconnectCalendar} className="btn btn-secondary">
                <Calendar size={16} />
                Desconectar
              </Button>
            ) : (
              <Button type="button" onClick={handleConnectCalendar}>
                <Calendar size={16} />
                Conectar Google Calendar
              </Button>
            )}
          </div>
          <p className="convite-hint">
            Ao registrar uma interação com próxima ação e data, o CRM cria automaticamente um evento no seu Google Calendar com lembrete de 1 hora. O token de acesso expira em 1 hora — reconecte se necessário.
          </p>
        </div>
      </article>

      {/* Equipe e papéis — Diretor e Admin */}
      {isAdmin && (
        <article className="panel">
            <div className="panel-header">
              <div><span>Administração</span><h2><Shield size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Equipe e papéis</h2></div>
            </div>

            {loadingEquipe ? (
              <div className="equipe-list">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skel skel-row" style={{ marginBottom: 8 }} />)}
              </div>
            ) : equipeError ? (
              <div className="config-msg config-msg-err">{equipeError}</div>
            ) : (
              <div className="equipe-list">
                {equipe.map((membro) => (
                  <div key={membro.id} className={`equipe-item ${!membro.ativo ? 'equipe-item-inativo' : ''}`}>
                    <div className="equipe-avatar">
                      {(membro.nome || membro.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="equipe-info">
                      <strong>{membro.nome || '(sem nome)'}</strong>
                      <span>{membro.email}</span>
                    </div>
                    <select
                      value={membro.perfil ?? 'consulta'}
                      onChange={(e) => handleRoleChange(membro.id, e.target.value)}
                      disabled={membro.id === session?.user?.id}
                      className="equipe-role-select"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value} title={r.desc}>{r.label}</option>
                      ))}
                    </select>
                    {membro.id !== session?.user?.id && (
                      <button
                        type="button"
                        className={`icon-btn ${membro.ativo ? 'icon-btn-danger' : ''}`}
                        title={membro.ativo ? 'Desativar acesso' : 'Reativar acesso'}
                        onClick={() => handleToggleAtivo(membro.id, membro.ativo)}
                      >
                        {membro.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
        </article>
      )}
    </div>
  );
}
