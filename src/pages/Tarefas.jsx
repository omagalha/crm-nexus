import { AlertCircle, CalendarCheck, CalendarClock, CheckCircle2, ChevronDown, LayoutList, CalendarDays, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CalendarView from '../components/CalendarView.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLeads } from '../hooks/useLeads.js';
import { concluirProximaAcao, reabrirProximaAcao } from '../services/leadsService.js';

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR');
}

function urgencia(dataAcao) {
  if (!dataAcao) return 'sem-prazo';
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(dataAcao);
  prazo.setHours(0, 0, 0, 0);
  const diff = Math.floor((prazo - hoje) / 86400000);
  if (diff < 0) return 'vencida';
  if (diff === 0) return 'hoje';
  if (diff <= 7) return 'semana';
  return 'futura';
}

function isConcluidaHoje(concluidaEm) {
  if (!concluidaEm) return false;
  const hoje = new Date();
  const data = new Date(concluidaEm);
  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  );
}

const GRUPOS = [
  { key: 'vencida', label: 'Vencidas',          icon: AlertCircle,   color: '#dc2626', bg: 'rgba(220,38,38,0.07)' },
  { key: 'hoje',    label: 'Para hoje',          icon: CalendarCheck, color: '#d97706', bg: 'rgba(217,119,6,0.07)' },
  { key: 'semana',  label: 'Esta semana',        icon: CalendarClock, color: '#2b7be0', bg: 'rgba(43,123,224,0.07)' },
  { key: 'futura',  label: 'Futuras',            icon: CalendarClock, color: '#557060', bg: 'rgba(85,112,96,0.07)' },
  { key: 'sem-prazo', label: 'Sem prazo definido', icon: CheckCircle2, color: '#9ca3af', bg: 'rgba(156,163,175,0.07)' },
];

export default function Tarefas() {
  const { leads, loading, reload } = useLeads();
  const showToast = useToast();
  const [busca, setBusca] = useState('');
  const [visao, setVisao] = useState('lista');
  const [concluidasOpen, setConcluidasOpen] = useState(false);
  const [completing, setCompleting] = useState(null);

  const todas = useMemo(() => {
    return leads
      .filter((l) => l.proximaAcao)
      .filter((l) => {
        if (!busca) return true;
        const t = busca.toLowerCase();
        return l.municipio.toLowerCase().includes(t) || l.proximaAcao.toLowerCase().includes(t);
      })
      .map((l) => ({
        id: l.id,
        municipio: l.municipio,
        uf: l.uf,
        acao: l.proximaAcao,
        prazo: l.dataAcao,
        status: l.status,
        urgencia: urgencia(l.dataAcao),
        concluidaEm: l.concluidaEm,
      }));
  }, [leads, busca]);

  const pendentes = useMemo(() => todas.filter((t) => !t.concluidaEm), [todas]);
  const concluidasHoje = useMemo(() => todas.filter((t) => isConcluidaHoje(t.concluidaEm)), [todas]);

  const grupos = useMemo(() => {
    return GRUPOS.map((g) => ({
      ...g,
      tarefas: pendentes.filter((t) => t.urgencia === g.key),
    })).filter((g) => g.tarefas.length > 0);
  }, [pendentes]);

  async function handleConcluir(tarefa) {
    setCompleting(tarefa.id);
    try {
      await concluirProximaAcao(tarefa.id);
      await reload();
      showToast(`"${tarefa.municipio}" marcada como concluída.`, 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao concluir tarefa.', 'error');
    } finally {
      setCompleting(null);
    }
  }

  async function handleReabrir(tarefa) {
    try {
      await reabrirProximaAcao(tarefa.id);
      await reload();
    } catch (err) {
      showToast(err.message || 'Erro ao reabrir tarefa.', 'error');
    }
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span>Operação comercial</span>
          <h1>Tarefas</h1>
          <p>Próximas ações consolidadas de todos os leads, ordenadas por urgência.</p>
        </div>
      </section>

      <div className="filter-bar">
        <div className="filter-search">
          <Search size={15} />
          <input
            placeholder="Buscar município ou ação…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="visao-toggle">
          <button
            type="button"
            className={visao === 'lista' ? 'active' : ''}
            onClick={() => setVisao('lista')}
            title="Visão lista"
          >
            <LayoutList size={15} /> Lista
          </button>
          <button
            type="button"
            className={visao === 'calendario' ? 'active' : ''}
            onClick={() => setVisao('calendario')}
            title="Visão calendário"
          >
            <CalendarDays size={15} /> Calendário
          </button>
        </div>
        <span className="filter-count">{pendentes.length} pendente{pendentes.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="panel">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skel skel-row" style={{ marginBottom: 10 }} />
          ))}
        </div>
      ) : visao === 'calendario' ? (
        <div className="panel" style={{ padding: '24px' }}>
          <CalendarView tarefas={todas} />
        </div>
      ) : pendentes.length === 0 && concluidasHoje.length === 0 ? (
        <div className="panel empty-state">
          <CheckCircle2 size={32} />
          <p>{leads.length === 0 ? 'Nenhum lead cadastrado ainda.' : 'Nenhuma próxima ação definida nos leads.'}</p>
        </div>
      ) : (
        <>
          {grupos.map((grupo) => {
            const Icon = grupo.icon;
            return (
              <section key={grupo.key} className="panel tarefa-grupo">
                <div className="tarefa-grupo-header" style={{ color: grupo.color, background: grupo.bg }}>
                  <Icon size={16} />
                  <strong>{grupo.label}</strong>
                  <span>{grupo.tarefas.length}</span>
                </div>
                <div className="tarefa-list">
                  {grupo.tarefas.map((t) => (
                    <div key={t.id} className="tarefa-item tarefa-item-row">
                      <button
                        type="button"
                        className={`tarefa-check ${completing === t.id ? 'tarefa-check-loading' : ''}`}
                        title="Marcar como concluída"
                        disabled={completing === t.id}
                        onClick={() => handleConcluir(t)}
                      />
                      <Link to={`/leads/${t.id}`} className="tarefa-item-body">
                        <div className="tarefa-info">
                          <strong>{t.municipio} / {t.uf}</strong>
                          <p>{t.acao}</p>
                        </div>
                        <div className="tarefa-meta">
                          {t.prazo && (
                            <span className={`tarefa-prazo tarefa-prazo-${t.urgencia}`}>
                              {formatDate(t.prazo)}
                            </span>
                          )}
                          <span className={`status-pill status-${t.status}`}>{t.status}</span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {concluidasHoje.length > 0 && (
            <section className="panel tarefa-grupo">
              <button
                type="button"
                className="tarefa-concluidas-header"
                onClick={() => setConcluidasOpen((v) => !v)}
              >
                <CheckCircle2 size={15} />
                <strong>Concluídas hoje</strong>
                <span>{concluidasHoje.length}</span>
                <ChevronDown size={14} className={`tarefa-chevron ${concluidasOpen ? 'is-open' : ''}`} />
              </button>
              {concluidasOpen && (
                <div className="tarefa-list">
                  {concluidasHoje.map((t) => (
                    <div key={t.id} className="tarefa-item tarefa-item-row tarefa-item-concluida">
                      <button
                        type="button"
                        className="tarefa-check tarefa-check-done"
                        title="Reabrir tarefa"
                        onClick={() => handleReabrir(t)}
                      />
                      <Link to={`/leads/${t.id}`} className="tarefa-item-body">
                        <div className="tarefa-info">
                          <strong>{t.municipio} / {t.uf}</strong>
                          <p>{t.acao}</p>
                        </div>
                        <div className="tarefa-meta">
                          <span className="tarefa-prazo" style={{ color: '#9ca3af' }}>
                            Concluída às {new Date(t.concluidaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
