import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLeads, usePipelineAtivos } from '../hooks/useLeads.js';

const PIPELINE_STAGES = [
  'Lead identificado',
  'Primeiro contato realizado',
  'Reunião agendada',
  'Diagnóstico realizado',
  'Proposta em elaboração',
  'Proposta enviada',
  'Em negociação',
  'Aguardando documentação/licitação',
];

const PRODUTO_LABEL = {
  simplifica_sim: 'Simplifica Sim',
  lab42: 'LAB 42',
  coletivamente: 'Coletivamente',
  consultoria: 'Consultoria',
  pacote_integrado: 'Pacote Nexus',
};

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatCurrency(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR');
}

function isVencida(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function SkeletonStat() {
  return <div className="skel skel-stat" />;
}

export default function Dashboard() {
  const { perfil } = useAuth();
  const { leads, loading } = useLeads();
  const { pipeline } = usePipelineAtivos();
  const nomeUsuario = perfil?.nome || 'Usuário';

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const stats = useMemo(() => {
    const ativos     = leads.filter((l) => l.status !== 'ganho' && l.status !== 'perdido');
    const quentes    = leads.filter((l) => l.status === 'quente');
    const ganhos     = leads.filter((l) => l.status === 'ganho');
    const totalValor = ativos.reduce((s, l) => s + (l.valor ?? 0), 0);
    const emPauta    = leads.filter((l) =>
      ['Proposta enviada', 'Em negociação', 'Aguardando documentação/licitação'].includes(l.etapa)
    );
    const vencidas   = ativos.filter((l) => l.proximaAcao && isVencida(l.dataAcao));
    const pendentes  = ativos.filter((l) => l.proximaAcao);
    return { ativos, quentes, ganhos, totalValor, emPauta, vencidas, pendentes };
  }, [leads]);

  const topMunicipios = useMemo(() =>
    [...leads]
      .filter((l) => l.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6),
    [leads]
  );

  const maxValor = topMunicipios[0]?.valor ?? 1;

  const stageMap = Object.fromEntries(pipeline.map((c) => [c.stage, c.leads.length]));

  const porProduto = useMemo(() =>
    Object.entries(
      leads.reduce((acc, l) => {
        if (!l.produto_interesse) return acc;
        acc[l.produto_interesse] = (acc[l.produto_interesse] ?? 0) + (l.valor ?? 0);
        return acc;
      }, {})
    )
      .map(([k, v]) => ({ label: PRODUTO_LABEL[k] ?? k, valor: v }))
      .sort((a, b) => b.valor - a.valor),
    [leads]
  );

  return (
    <div className="dash">

      {/* Saudação */}
      <div className="dash-top">
        <div>
          <h1 className="dash-hello">{saudacao()}, <span>{nomeUsuario}</span></h1>
          <p className="dash-date">{hoje}</p>
        </div>
        <span className="dash-badge">Nexus Educação CRM</span>
      </div>

      {/* Métricas */}
      <div className="dash-metrics">
        <div className="dash-hero">
          <p>Valor em pipeline</p>
          {loading
            ? <div className="skel skel-hero" />
            : <strong>{stats.totalValor > 0 ? formatCurrency(stats.totalValor) : 'R$ 0'}</strong>
          }
          <small>Pipeline total estimado</small>
        </div>
        <div className="dash-stats">
          {loading ? (
            <><SkeletonStat /><div className="dash-stat-divider" /><SkeletonStat /><div className="dash-stat-divider" /><SkeletonStat /><div className="dash-stat-divider" /><SkeletonStat /><div className="dash-stat-divider" /><SkeletonStat /></>
          ) : (
            <>
              <div className="dash-stat">
                <strong>{stats.ativos.length}</strong>
                <span>Leads ativos</span>
              </div>
              <div className="dash-stat-divider" />
              <div className="dash-stat">
                <strong>{stats.emPauta.length}</strong>
                <span>Propostas em pauta</span>
              </div>
              <div className="dash-stat-divider" />
              <div className="dash-stat" style={{ color: '#dc2626' }}>
                <strong>{stats.quentes.length}</strong>
                <span>Leads quentes</span>
              </div>
              <div className="dash-stat-divider" />
              <div className="dash-stat dash-stat-accent">
                <strong>{stats.ganhos.length}</strong>
                <span>Contratos fechados</span>
              </div>
              <div className="dash-stat-divider" />
              <div className={`dash-stat ${stats.vencidas.length > 0 ? 'dash-stat-warn' : ''}`}>
                <strong>{stats.vencidas.length}</strong>
                <span>Tarefas vencidas</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alertas — só aparece se houver */}
      {!loading && stats.vencidas.length > 0 && (
        <div className="dash-alerts">
          <div className="dash-alert-header">
            <AlertTriangle size={16} />
            <strong>{stats.vencidas.length} tarefa{stats.vencidas.length > 1 ? 's' : ''} vencida{stats.vencidas.length > 1 ? 's' : ''} — ação necessária</strong>
          </div>
          <div className="dash-alert-list">
            {stats.vencidas.slice(0, 4).map((lead) => (
              <Link key={lead.id} to={`/leads/${lead.id}`} className="dash-alert-item">
                <strong>{lead.municipio} / {lead.uf}</strong>
                <span>{lead.proximaAcao}</span>
                <em>Prazo: {formatDate(lead.dataAcao)}</em>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Corpo */}
      <div className="dash-body">

        {/* Coluna principal */}
        <div className="dash-main-col">

          {/* Ranking de municípios */}
          <div className="dash-panel">
            <header className="dash-panel-header">
              <h2><TrendingUp size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Top municípios por valor</h2>
              <Link to="/municipios" className="dash-link">Ver todos →</Link>
            </header>
            {loading ? (
              <><div className="skel skel-row" style={{ marginBottom: 8 }} /><div className="skel skel-row" style={{ marginBottom: 8 }} /><div className="skel skel-row" /></>
            ) : topMunicipios.length === 0 ? (
              <p className="dash-empty">Nenhum lead com valor definido.</p>
            ) : (
              <div className="dash-ranking">
                {topMunicipios.map((lead, i) => (
                  <Link key={lead.id} to={`/leads/${lead.id}`} className="dash-ranking-row">
                    <span className="dash-ranking-pos">{i + 1}</span>
                    <div className="dash-ranking-info">
                      <strong>{lead.municipio} / {lead.uf}</strong>
                      <div className="dash-ranking-bar-track">
                        <div className="dash-ranking-bar-fill" style={{ width: `${(lead.valor / maxValor) * 100}%` }} />
                      </div>
                    </div>
                    <strong className="dash-ranking-valor">{formatCurrency(lead.valor)}</strong>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline funnel */}
          <div className="dash-panel">
            <header className="dash-panel-header">
              <h2>Funil comercial</h2>
              <Link to="/leads" className="dash-link">Abrir pipeline →</Link>
            </header>
            <div className="dash-funnel">
              {PIPELINE_STAGES.map((stage, i) => {
                const count = stageMap[stage] ?? 0;
                return (
                  <div key={stage} className="dash-funnel-stage">
                    <div className={`dash-funnel-dot ${count > 0 ? 'is-active' : ''}`}>
                      {count > 0 && <span>{count}</span>}
                    </div>
                    {i < PIPELINE_STAGES.length - 1 && (
                      <div className={`dash-funnel-line ${count > 0 ? 'is-active' : ''}`} />
                    )}
                    <p>{stage}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Coluna lateral */}
        <div className="dash-side-col">

          {/* Próximas ações */}
          <div className="dash-panel">
            <header className="dash-panel-header">
              <h2>Próximas ações</h2>
              <Link to="/tarefas" className="dash-link">Ver todas →</Link>
            </header>
            <div className="dash-agenda">
              {loading && <><div className="skel skel-agenda-item" /><div className="skel skel-agenda-item" /><div className="skel skel-agenda-item" /></>}
              {!loading && stats.pendentes.length === 0 && <p className="dash-empty">Nenhuma ação pendente.</p>}
              {!loading && stats.pendentes.slice(0, 6).map((lead) => (
                <Link key={lead.id} to={`/leads/${lead.id}`} className="dash-agenda-item">
                  <span
                    className="dash-agenda-dot"
                    style={{ background: isVencida(lead.dataAcao) ? '#dc2626' : lead.status === 'quente' ? '#f59e0b' : '#3ddc68' }}
                  />
                  <div className="dash-agenda-body">
                    <strong>{lead.municipio} / {lead.uf}</strong>
                    <span>{lead.proximaAcao}</span>
                  </div>
                  {lead.dataAcao && <span className="dash-agenda-tag">{formatDate(lead.dataAcao)}</span>}
                </Link>
              ))}
            </div>
          </div>

          {/* Valor por produto */}
          <div className="dash-panel">
            <header className="dash-panel-header">
              <h2>Valor por produto</h2>
              <Link to="/relatorios" className="dash-link">Relatórios →</Link>
            </header>
            {loading
              ? <div className="skel skel-row" />
              : porProduto.length === 0
              ? <span className="dash-empty">Sem dados ainda.</span>
              : (
                <div className="dash-produto-list">
                  {porProduto.map(({ label, valor }) => (
                    <div key={label} className="dash-produto-row">
                      <span>{label}</span>
                      <strong>{formatCurrency(valor)}</strong>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

        </div>
      </div>
    </div>
  );
}
