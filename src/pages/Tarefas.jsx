import { AlertCircle, CalendarCheck, CalendarClock, CheckCircle2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeads } from '../hooks/useLeads.js';

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

const GRUPOS = [
  {
    key: 'vencida',
    label: 'Vencidas',
    icon: AlertCircle,
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.07)',
  },
  {
    key: 'hoje',
    label: 'Para hoje',
    icon: CalendarCheck,
    color: '#d97706',
    bg: 'rgba(217,119,6,0.07)',
  },
  {
    key: 'semana',
    label: 'Esta semana',
    icon: CalendarClock,
    color: '#2b7be0',
    bg: 'rgba(43,123,224,0.07)',
  },
  {
    key: 'futura',
    label: 'Futuras',
    icon: CalendarClock,
    color: '#557060',
    bg: 'rgba(85,112,96,0.07)',
  },
  {
    key: 'sem-prazo',
    label: 'Sem prazo definido',
    icon: CheckCircle2,
    color: '#9ca3af',
    bg: 'rgba(156,163,175,0.07)',
  },
];

export default function Tarefas() {
  const { leads, loading } = useLeads();
  const [busca, setBusca] = useState('');

  const tarefas = useMemo(() => {
    return leads
      .filter((l) => l.proximaAcao)
      .filter((l) => {
        if (!busca) return true;
        const t = busca.toLowerCase();
        return (
          l.municipio.toLowerCase().includes(t) ||
          l.proximaAcao.toLowerCase().includes(t)
        );
      })
      .map((l) => ({
        id: l.id,
        municipio: l.municipio,
        uf: l.uf,
        acao: l.proximaAcao,
        prazo: l.dataAcao,
        status: l.status,
        urgencia: urgencia(l.dataAcao),
      }));
  }, [leads, busca]);

  const grupos = useMemo(() => {
    return GRUPOS.map((g) => ({
      ...g,
      tarefas: tarefas.filter((t) => t.urgencia === g.key),
    })).filter((g) => g.tarefas.length > 0);
  }, [tarefas]);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span>Operação comercial</span>
          <h1>Tarefas</h1>
          <p>Próximas ações consolidadas de todos os leads, ordenadas por urgência.</p>
        </div>
      </section>

      {/* Busca */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={15} />
          <input
            placeholder="Buscar município ou ação…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <span className="filter-count">{tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="panel">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skel skel-row" style={{ marginBottom: 10 }} />
          ))}
        </div>
      ) : tarefas.length === 0 ? (
        <div className="panel empty-state">
          <CheckCircle2 size={32} />
          <p>{leads.length === 0 ? 'Nenhum lead cadastrado ainda.' : 'Nenhuma próxima ação definida nos leads.'}</p>
        </div>
      ) : (
        grupos.map((grupo) => {
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
                  <Link key={t.id} to={`/leads/${t.id}`} className="tarefa-item">
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
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
