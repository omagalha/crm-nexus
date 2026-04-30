import { Mail, MessageCircle, Phone, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getContatos } from '../services/contatosService.js';

const CARGO_LABEL = {
  prefeito: 'Prefeito(a)',
  secretario_educacao: 'Secretário(a) de Educação',
  subsecretario: 'Subsecretário(a)',
  coordenador_pedagogico: 'Coordenador(a) Pedagógico(a)',
  diretor_administrativo: 'Diretor(a) Administrativo(a)',
  responsavel_compras: 'Responsável por Compras',
  assessor_politico: 'Assessor(a) Político(a)',
  outro: 'Outro',
};

function whatsappUrl(value) {
  const digits = value?.replace(/\D/g, '');
  if (!digits) return '';
  const number = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${number}`;
}

export default function Contatos() {
  const [contatos, setContatos] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadContacts() {
      try {
        setLoading(true);
        const data = await getContatos();
        if (active) setContatos(data);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadContacts();

    return () => {
      active = false;
    };
  }, []);

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return contatos;

    return contatos.filter((contato) => {
      const cargo = CARGO_LABEL[contato.cargo] ?? contato.cargo ?? '';
      return [contato.nome, cargo, contato.municipio, contato.uf]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [contatos, search]);

  const totalLabel = `${filteredContacts.length} ${filteredContacts.length === 1 ? 'contato' : 'contatos'}`;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span>Agenda institucional</span>
          <h1>Contatos</h1>
          <p>Encontre rapidamente interlocutores de todos os municípios da carteira.</p>
        </div>
      </section>

      <section className="contacts-toolbar">
        <label className="territory-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, cargo ou município"
          />
        </label>
        <strong>{totalLabel}</strong>
      </section>

      {loading ? (
        <section className="contacts-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={index} className="contact-card contact-directory-card">
              <div className="skel skel-card" />
            </article>
          ))}
        </section>
      ) : error ? (
        <section className="panel empty-state">
          <h2>Não foi possível carregar os contatos</h2>
          <p>{error.message}</p>
        </section>
      ) : filteredContacts.length === 0 ? (
        <section className="panel empty-state">
          <h2>{search ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}</h2>
          <p>
            {search
              ? 'Tente buscar por outro nome, cargo ou município.'
              : 'Cadastre contatos na tela de criação ou edição de um lead municipal.'}
          </p>
        </section>
      ) : (
        <section className="contacts-grid">
          {filteredContacts.map((contato) => {
            const iniciais = contato.nome
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0].toUpperCase())
              .join('');
            return (
              <article key={contato.id} className="cdir-card">
                <div className="cdir-top">
                  <div className="cdir-avatar">{iniciais}</div>
                  <div className="cdir-info">
                    <div className="cdir-name-row">
                      <strong>{contato.nome}</strong>
                      {contato.ehPrincipal && <span className="cdir-badge">Principal</span>}
                    </div>
                    <span className="cdir-cargo">{CARGO_LABEL[contato.cargo] ?? contato.cargo ?? 'Cargo não informado'}</span>
                    <Link className="cdir-municipio" to={`/leads/${contato.leadId}`}>
                      {contato.municipio} / {contato.uf}
                    </Link>
                  </div>
                </div>

                {(contato.telefone || contato.email || contato.whatsapp) && (
                  <div className="cdir-actions">
                    {contato.telefone && (
                      <a className="cdir-btn" href={`tel:${contato.telefone.replace(/\D/g, '')}`} title={contato.telefone}>
                        <Phone size={15} />
                      </a>
                    )}
                    {contato.email && (
                      <a className="cdir-btn" href={`mailto:${contato.email}`} title={contato.email}>
                        <Mail size={15} />
                      </a>
                    )}
                    {contato.whatsapp && (
                      <a className="cdir-btn cdir-btn-wpp" href={whatsappUrl(contato.whatsapp)} target="_blank" rel="noreferrer" title="WhatsApp">
                        <MessageCircle size={15} />
                      </a>
                    )}
                    <Link className="cdir-ver" to={`/leads/${contato.leadId}`}>
                      Ver lead →
                    </Link>
                  </div>
                )}

                {!contato.telefone && !contato.email && !contato.whatsapp && (
                  <div className="cdir-actions">
                    <Link className="cdir-ver" to={`/leads/${contato.leadId}`}>
                      Ver lead →
                    </Link>
                  </div>
                )}

                {contato.leadEtapa && (
                  <div className="cdir-etapa">{contato.leadEtapa}</div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
