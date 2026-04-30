import { FileText, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPropostas } from '../services/leadsService.js';

const PRODUTO_LABEL = {
  simplifica_sim: 'Simplifica Sim',
  lab42: 'LAB 42',
  coletivamente: 'Coletivamente',
  consultoria: 'Consultoria Educacional',
  pacote_integrado: 'Pacote Nexus',
};

const STATUS_LABEL = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  em_negociacao: 'Em negociação',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  cancelada: 'Cancelada',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

function formatCurrency(value) {
  if (!value) return '—';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Propostas() {
  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  useEffect(() => {
    getPropostas()
      .then(setPropostas)
      .catch((err) => setError(err.message || 'Erro ao carregar propostas.'))
      .finally(() => setLoading(false));
  }, []);

  const resultado = useMemo(() => {
    return propostas.filter((p) => {
      const termoBusca = busca.toLowerCase();
      const bateBusca =
        !busca ||
        p.municipio.toLowerCase().includes(termoBusca) ||
        (PRODUTO_LABEL[p.produto] ?? p.produto ?? '').toLowerCase().includes(termoBusca);
      const bateStatus = !filtroStatus || p.status === filtroStatus;
      return bateBusca && bateStatus;
    });
  }, [propostas, busca, filtroStatus]);

  const totais = useMemo(() => ({
    count: resultado.length,
    valor: resultado.reduce((acc, p) => acc + (p.valor ?? 0), 0),
  }), [resultado]);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span>Documentos comerciais</span>
          <h1>Propostas</h1>
          <p>Acompanhamento de propostas em análise, negociação e assinatura.</p>
        </div>
      </section>

      {/* Filtros */}
      <div className="filter-bar">
        <div className="filter-search">
          <Search size={15} />
          <input
            placeholder="Buscar município ou produto…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <span className="filter-count">{totais.count} proposta{totais.count !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="table-panel">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skel skel-row" />
          ))}
        </div>
      ) : error ? (
        <div className="panel empty-state">
          <p>{error}</p>
        </div>
      ) : resultado.length === 0 ? (
        <div className="panel empty-state">
          <FileText size={32} />
          <p>{propostas.length === 0 ? 'Nenhuma proposta registrada ainda.' : 'Nenhuma proposta encontrada para os filtros aplicados.'}</p>
        </div>
      ) : (
        <>
          <div className="table-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Município</th>
                  <th>Produto</th>
                  <th>Valor estimado</th>
                  <th>Status</th>
                  <th>Enviada em</th>
                  <th>Válida até</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resultado.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.municipio}</strong>
                      {p.uf && <span className="table-sub"> / {p.uf}</span>}
                    </td>
                    <td>{PRODUTO_LABEL[p.produto] ?? p.produto ?? '—'}</td>
                    <td>{formatCurrency(p.valor)}</td>
                    <td>
                      <span className={`status-pill status-proposta-${p.status}`}>
                        {STATUS_LABEL[p.status] ?? p.status ?? '—'}
                      </span>
                    </td>
                    <td>{formatDate(p.dataEnvio)}</td>
                    <td>{formatDate(p.validadeAte)}</td>
                    <td>
                      {p.leadId && (
                        <Link to={`/leads/${p.leadId}`} className="table-link">
                          Ver lead →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com total */}
          <div className="table-footer">
            <span>Total filtrado:</span>
            <strong>{formatCurrency(totais.valor)}</strong>
          </div>
        </>
      )}
    </div>
  );
}
