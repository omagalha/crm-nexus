import { useLeads } from '../hooks/useLeads.js';

const PRODUTO_LABEL = {
  simplifica_sim: 'Simplifica Sim',
  lab42: 'LAB 42',
  coletivamente: 'Coletivamente',
  consultoria: 'Consultoria Educacional',
  pacote_integrado: 'Pacote Nexus',
};

const STATUS_CONFIG = {
  frio:    { label: 'Frio',    color: '#93c5fd' },
  morno:   { label: 'Morno',   color: '#fcd34d' },
  quente:  { label: 'Quente',  color: '#f87171' },
  ganho:   { label: 'Ganho',   color: '#4ade80' },
  perdido: { label: 'Perdido', color: '#d1d5db' },
};

const ETAPAS = [
  'Lead identificado',
  'Primeiro contato realizado',
  'Reunião agendada',
  'Diagnóstico realizado',
  'Proposta em elaboração',
  'Proposta enviada',
  'Em negociação',
  'Aguardando documentação/licitação',
  'Contrato fechado',
  'Perdido / pausado',
];

function formatCurrency(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function BarChart({ items, total }) {
  return (
    <div className="rel-bar-list">
      {items.map(({ label, value, color }) => (
        <div key={label} className="rel-bar-row">
          <span className="rel-bar-label">{label}</span>
          <div className="rel-bar-track">
            <div
              className="rel-bar-fill"
              style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%', background: color }}
            />
          </div>
          <span className="rel-bar-value">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Relatorios() {
  const { leads, loading } = useLeads();

  const totalValor = leads.reduce((s, l) => s + (l.valor ?? 0), 0);
  const ganhos = leads.filter((l) => l.status === 'ganho');
  const perdidos = leads.filter((l) => l.status === 'perdido');
  const taxaConversao = leads.length > 0 ? Math.round((ganhos.length / leads.length) * 100) : 0;

  const porStatus = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    label: cfg.label,
    value: leads.filter((l) => l.status === key).length,
    color: cfg.color,
  }));

  const porProduto = Object.entries(PRODUTO_LABEL).map(([key, label]) => ({
    label,
    value: leads.filter((l) => l.produto_interesse === key).length,
    color: '#3ddc68',
  })).filter((i) => i.value > 0);

  const porEtapa = ETAPAS.map((etapa) => ({
    label: etapa,
    value: leads.filter((l) => l.etapa === etapa).length,
  }));

  const valorPorProduto = Object.entries(PRODUTO_LABEL).map(([key, label]) => {
    const valor = leads.filter((l) => l.produto_interesse === key).reduce((s, l) => s + (l.valor ?? 0), 0);
    return { label, valor };
  }).filter((i) => i.valor > 0).sort((a, b) => b.valor - a.valor);

  const maxEtapa = Math.max(...porEtapa.map((e) => e.value), 1);

  if (loading) {
    return (
      <div className="page-stack">
        <div className="skel skel-hero-bar" />
        <div className="content-grid">
          <div className="skel skel-panel" style={{ height: 280 }} />
          <div className="skel skel-panel" style={{ height: 280 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span>Análise comercial</span>
          <h1>Relatórios</h1>
          <p>Visão consolidada do pipeline, conversão e distribuição por produto.</p>
        </div>
      </section>

      {/* Métricas gerais */}
      <div className="rel-metrics">
        <div className="rel-metric-card">
          <span>Total de leads</span>
          <strong>{leads.length}</strong>
        </div>
        <div className="rel-metric-card">
          <span>Valor no pipeline</span>
          <strong>{formatCurrency(totalValor)}</strong>
        </div>
        <div className="rel-metric-card rel-metric-success">
          <span>Contratos fechados</span>
          <strong>{ganhos.length}</strong>
        </div>
        <div className="rel-metric-card rel-metric-danger">
          <span>Leads perdidos</span>
          <strong>{perdidos.length}</strong>
        </div>
        <div className="rel-metric-card rel-metric-accent">
          <span>Taxa de conversão</span>
          <strong>{taxaConversao}%</strong>
        </div>
      </div>

      <div className="content-grid">
        {/* Por status */}
        <article className="panel">
          <div className="panel-header">
            <div><span>Distribuição</span><h2>Por status</h2></div>
          </div>
          {leads.length === 0
            ? <p className="muted-text">Sem dados ainda.</p>
            : <BarChart items={porStatus} total={leads.length} />}
        </article>

        {/* Por produto */}
        <article className="panel">
          <div className="panel-header">
            <div><span>Distribuição</span><h2>Por produto</h2></div>
          </div>
          {porProduto.length === 0
            ? <p className="muted-text">Nenhum produto definido nos leads.</p>
            : <BarChart items={porProduto} total={leads.length} />}
        </article>
      </div>

      {/* Funil por etapa */}
      <article className="panel">
        <div className="panel-header">
          <div><span>Funil</span><h2>Leads por etapa do pipeline</h2></div>
        </div>
        {leads.length === 0 ? (
          <p className="muted-text">Sem dados ainda.</p>
        ) : (
          <div className="rel-funnel">
            {porEtapa.map(({ label, value }) => (
              <div key={label} className="rel-funnel-row">
                <span className="rel-funnel-label">{label}</span>
                <div className="rel-funnel-track">
                  <div
                    className="rel-funnel-fill"
                    style={{ width: `${(value / maxEtapa) * 100}%` }}
                  />
                </div>
                <span className="rel-funnel-count">{value}</span>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Valor por produto */}
      {valorPorProduto.length > 0 && (
        <article className="panel">
          <div className="panel-header">
            <div><span>Potencial</span><h2>Valor estimado por produto</h2></div>
          </div>
          <div className="rel-valor-list">
            {valorPorProduto.map(({ label, valor }) => (
              <div key={label} className="rel-valor-row">
                <span>{label}</span>
                <strong>{formatCurrency(valor)}</strong>
              </div>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}
