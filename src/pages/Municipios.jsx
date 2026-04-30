import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeads } from '../hooks/useLeads.js';

const PRODUCT_LABEL = {
  simplifica_sim: 'Simplifica Sim',
  lab42: 'LAB 42',
  coletivamente: 'Coletivamente',
  consultoria: 'Consultoria Educacional',
  pacote_integrado: 'Pacote integrado Nexus',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'frio', label: 'Frio' },
  { value: 'morno', label: 'Morno' },
  { value: 'quente', label: 'Quente' },
  { value: 'ganho', label: 'Ganho' },
  { value: 'perdido', label: 'Perdido' },
];

function formatCurrency(value) {
  if (!value) return 'A definir';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function Municipios() {
  const { leads, loading, error } = useLeads();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [uf, setUf] = useState('');

  const ufOptions = useMemo(() => {
    return [...new Set(leads.map((lead) => lead.uf).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [leads]);

  const filteredMunicipios = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch = normalizedSearch
        ? lead.municipio.toLowerCase().includes(normalizedSearch)
        : true;
      const matchesStatus = status ? lead.status === status : true;
      const matchesUf = uf ? lead.uf === uf : true;

      return matchesSearch && matchesStatus && matchesUf;
    });
  }, [leads, search, status, uf]);

  const hasFilters = Boolean(search || status || uf);
  const totalLabel = `${filteredMunicipios.length} ${filteredMunicipios.length === 1 ? 'município' : 'municípios'}`;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span>Carteira territorial</span>
          <h1>Municípios</h1>
          <p>Visão por município como unidade de negócio, com contexto educacional e próxima ação.</p>
        </div>
      </section>

      <section className="territory-toolbar">
        <label className="territory-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar município"
          />
        </label>

        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por status">
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select value={uf} onChange={(event) => setUf(event.target.value)} aria-label="Filtrar por UF">
          <option value="">Todas as UFs</option>
          {ufOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <strong>{totalLabel}</strong>
      </section>

      {loading ? (
        <section className="territory-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="municipio-card">
              <div className="skel skel-card" />
            </article>
          ))}
        </section>
      ) : error ? (
        <section className="panel empty-state">
          <h2>Não foi possível carregar os municípios</h2>
          <p>{error.message}</p>
        </section>
      ) : filteredMunicipios.length === 0 ? (
        <section className="panel empty-state">
          <h2>{hasFilters ? 'Nenhum município encontrado' : 'Nenhum município cadastrado'}</h2>
          <p>
            {hasFilters
              ? 'Ajuste a busca ou remova filtros para ampliar os resultados.'
              : 'Cadastre o primeiro lead municipal para iniciar a carteira territorial.'}
          </p>
          {!hasFilters && (
            <Link to="/leads/novo" className="btn btn-primary">
              + Novo lead
            </Link>
          )}
        </section>
      ) : (
        <section className="territory-grid">
          {filteredMunicipios.map((lead) => (
            <article key={lead.id} className="municipio-card territory-card">
              <header>
                <div>
                  <h2>{lead.municipio}</h2>
                  <span>{lead.uf}</span>
                </div>
                <small className={`status-pill status-${lead.status}`}>{lead.status}</small>
              </header>

              <dl>
                <div>
                  <dt>Etapa</dt>
                  <dd>{lead.etapa || 'Sem etapa'}</dd>
                </div>
                <div>
                  <dt>Produto</dt>
                  <dd>{PRODUCT_LABEL[lead.produto_interesse] ?? 'A definir'}</dd>
                </div>
                <div>
                  <dt>Valor estimado</dt>
                  <dd>{formatCurrency(lead.valor)}</dd>
                </div>
                <div>
                  <dt>Contato principal</dt>
                  <dd>{lead.responsavel || 'Não informado'}</dd>
                </div>
                <div>
                  <dt>Alunos estimados</dt>
                  <dd>{lead.num_alunos_estimado ? lead.num_alunos_estimado.toLocaleString('pt-BR') : 'A definir'}</dd>
                </div>
              </dl>

              {lead.proximaAcao && (
                <div className="territory-next-action">
                  <span>Próxima ação</span>
                  <strong>{lead.proximaAcao}</strong>
                  {lead.dataAcao && <small>{formatDate(lead.dataAcao)}</small>}
                </div>
              )}

              <Link to={`/leads/${lead.id}`} className="btn btn-ghost">
                Ver detalhes
              </Link>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
