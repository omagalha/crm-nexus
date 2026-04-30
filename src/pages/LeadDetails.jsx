import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  FileText,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Reply,
  Save,
  Send,
  Trash2,
  UsersRound,
  Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useLead } from '../hooks/useLead.js';
import { isCalendarConnected, syncLeadCalendar } from '../services/googleCalendarService.js';
import { addContato, createInteraction, deleteContato, setLeadGcalEventId, updateContato } from '../services/leadsService.js';

const initialContato = { nome: '', cargo: '', email: '', telefone: '', whatsapp: '', observacoes: '', eh_principal: false };

const PRODUTO_LABEL = {
  simplifica_sim: 'Simplifica Sim',
  lab42: 'LAB 42',
  coletivamente: 'Coletivamente',
  consultoria: 'Consultoria Educacional',
  pacote_integrado: 'Pacote Nexus',
};

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

const INTERACTION_TYPES = [
  { value: 'ligacao',            label: 'Ligação',            icon: Phone,          color: '#1a9940' },
  { value: 'whatsapp',           label: 'WhatsApp',           icon: MessageCircle,  color: '#25d366' },
  { value: 'email',              label: 'E-mail',             icon: Mail,           color: '#2b7be0' },
  { value: 'reuniao_online',     label: 'Reunião online',     icon: Video,          color: '#7c3aed' },
  { value: 'reuniao_presencial', label: 'Reunião presencial', icon: UsersRound,     color: '#7c3aed' },
  { value: 'envio_proposta',     label: 'Envio de proposta',  icon: Send,           color: '#d97706' },
  { value: 'envio_material',     label: 'Envio de material',  icon: FileText,       color: '#d97706' },
  { value: 'retorno_recebido',   label: 'Retorno recebido',   icon: Reply,          color: '#0891b2' },
  { value: 'pendencia',          label: 'Pendência',          icon: AlertCircle,    color: '#dc2626' },
];

const TYPE_MAP = Object.fromEntries(INTERACTION_TYPES.map((t) => [t.value, t]));

const initialInteraction = {
  tipo: 'ligacao',
  contato_id: '',
  resumo: '',
  proxima_acao: '',
  prazo_proxima_acao: '',
};

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('pt-BR');
}

function whatsappUrl(number, message) {
  const digits = number?.replace(/\D/g, '');
  if (!digits) return '';
  const phone = digits.startsWith('55') ? digits : `55${digits}`;
  if (!message) return `https://wa.me/${phone}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export default function LeadDetails() {
  const { leadId } = useParams();
  const { lead, loading, error, reload } = useLead(leadId);
  const { perfil } = useAuth();
  const showToast = useToast();

  // interações
  const [interactionForm, setInteractionForm] = useState(initialInteraction);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // contatos
  const [contatoForm, setContatoForm] = useState(initialContato);
  const [contatoEditId, setContatoEditId] = useState(null);
  const [contatoFormOpen, setContatoFormOpen] = useState(false);
  const [savingContato, setSavingContato] = useState(false);
  const [contatoError, setContatoError] = useState('');

  const sortedInteractions = useMemo(
    () => [...(lead?.interacoes ?? [])].sort((a, b) => new Date(b.data) - new Date(a.data)),
    [lead?.interacoes],
  );

  function openNewContato() {
    setContatoForm(initialContato);
    setContatoEditId(null);
    setContatoError('');
    setContatoFormOpen(true);
  }

  function openEditContato(c) {
    setContatoForm({ nome: c.nome ?? '', cargo: c.cargo ?? '', email: c.email ?? '', telefone: c.telefone ?? '', whatsapp: c.whatsapp ?? '', observacoes: c.observacoes ?? '', eh_principal: c.eh_principal ?? false });
    setContatoEditId(c.id);
    setContatoError('');
    setContatoFormOpen(true);
  }

  function updateContatoField(e) {
    const { name, value, type, checked } = e.target;
    setContatoForm((cur) => ({ ...cur, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleContatoSubmit(e) {
    e.preventDefault();
    setContatoError('');
    if (!contatoForm.nome.trim()) { setContatoError('Informe o nome do contato.'); return; }
    try {
      setSavingContato(true);
      if (contatoEditId) {
        await updateContato(contatoEditId, contatoForm);
      } else {
        await addContato(leadId, contatoForm);
      }
      setContatoFormOpen(false);
      await reload();
      showToast(contatoEditId ? 'Contato atualizado.' : 'Contato adicionado.');
    } catch (err) {
      setContatoError(err.message || 'Não foi possível salvar o contato.');
    } finally {
      setSavingContato(false);
    }
  }

  async function handleDeleteContato(contatoId) {
    if (!window.confirm('Remover este contato?')) return;
    try {
      await deleteContato(contatoId);
      await reload();
    } catch (err) {
      alert(err.message || 'Não foi possível remover o contato.');
    }
  }

  function openInteractionForm(tipo = 'ligacao') {
    setInteractionForm((cur) => ({ ...initialInteraction, tipo }));
    setFormError('');
    setFormOpen(true);
    setTimeout(() => document.querySelector('.interaction-form textarea')?.focus(), 50);
  }

  function updateInteraction(e) {
    const { name, value } = e.target;
    setInteractionForm((cur) => ({ ...cur, [name]: value }));
  }

  async function handleInteractionSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!interactionForm.resumo.trim()) {
      setFormError('Informe um resumo da interação.');
      return;
    }
    try {
      setSaving(true);
      await createInteraction(leadId, interactionForm);

      // Sincroniza Google Calendar se conectado e a interação definiu próxima ação
      if (isCalendarConnected() && interactionForm.proxima_acao && interactionForm.prazo_proxima_acao) {
        const updatedLead = {
          ...lead,
          proximaAcao: interactionForm.proxima_acao,
          dataAcao: interactionForm.prazo_proxima_acao,
        };
        const newEventId = await syncLeadCalendar(updatedLead, lead.gcalEventId);
        if (newEventId !== lead.gcalEventId) {
          await setLeadGcalEventId(leadId, newEventId);
        }
      }

      setInteractionForm(initialInteraction);
      setFormOpen(false);
      await reload();
      showToast('Interação registrada com sucesso!');
    } catch (err) {
      setFormError(err.message || 'Não foi possível registrar a interação.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-stack">
        <div className="skel skel-hero-bar" />
        <div className="content-grid">
          <div className="skel skel-panel" />
          <div className="skel skel-panel" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="panel empty-state">
        <h1>Lead não encontrado</h1>
        <Link to="/leads">Voltar para leads</Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Link className="back-link" to="/leads">
        <ArrowLeft size={18} /> Voltar
      </Link>

      {/* Hero */}
      <section className="detail-hero">
        <div>
          <span className={`status-pill status-${lead.status}`}>{lead.status}</span>
          <h1>{lead.municipio} / {lead.uf}</h1>
          <p>{lead.etapa}</p>
        </div>
        <div className="detail-actions">
          <Link to={`/leads/${leadId}/editar`} className="btn btn-ghost">Editar</Link>
          <Button type="button" onClick={() => openInteractionForm('ligacao')}>
            + Registrar interação
          </Button>
        </div>
      </section>

      {/* Contatos + Resumo */}
      <section className="content-grid">
        <article className="panel">
          <div className="panel-header">
            <div><span>Relacionamento</span><h2>Contatos</h2></div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={openNewContato}>
              <Plus size={14} /> Adicionar
            </button>
          </div>

          {/* Formulário inline de contato */}
          {contatoFormOpen && (
            <form className="contato-form" onSubmit={handleContatoSubmit}>
              {contatoError && <div className="form-alert">{contatoError}</div>}
              <div className="form-grid">
                <label>
                  Nome *
                  <input name="nome" value={contatoForm.nome} onChange={updateContatoField} required />
                </label>
                <label>
                  Cargo
                  <select name="cargo" value={contatoForm.cargo} onChange={updateContatoField}>
                    <option value="">Selecione</option>
                    {Object.entries(CARGO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
                <label>
                  E-mail
                  <input name="email" type="email" value={contatoForm.email} onChange={updateContatoField} />
                </label>
                <label>
                  Telefone
                  <input name="telefone" value={contatoForm.telefone} onChange={updateContatoField} placeholder="(00) 00000-0000" />
                </label>
                <label>
                  WhatsApp
                  <input name="whatsapp" value={contatoForm.whatsapp} onChange={updateContatoField} placeholder="(00) 00000-0000" />
                </label>
                <label className="checkbox-field">
                  <input name="eh_principal" type="checkbox" checked={contatoForm.eh_principal} onChange={updateContatoField} />
                  Contato principal
                </label>
                <label className="form-field-wide">
                  Observações
                  <input name="observacoes" value={contatoForm.observacoes} onChange={updateContatoField} />
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setContatoFormOpen(false)}>Cancelar</button>
                <Button type="submit" disabled={savingContato}>
                  <Save size={15} />
                  {savingContato ? 'Salvando…' : contatoEditId ? 'Salvar alterações' : 'Adicionar contato'}
                </Button>
              </div>
            </form>
          )}

          {lead.contatos.length === 0 && !contatoFormOpen ? (
            <p className="muted-text">Nenhum contato cadastrado.</p>
          ) : (
            <div className="contact-stack">
              {lead.contatos.map((c) => (
                <div key={c.id} className="contact-card">
                  <div className="contact-card-header">
                    <div>
                      <strong>{c.nome}</strong>
                      {c.eh_principal && <span className="contact-badge">Principal</span>}
                      <span className="contact-cargo">{CARGO_LABEL[c.cargo] ?? c.cargo}</span>
                    </div>
                    <div className="contact-actions">
                      <button type="button" className="icon-btn" title="Editar" onClick={() => openEditContato(c)}>
                        <Pencil size={13} />
                      </button>
                      <button type="button" className="icon-btn icon-btn-danger" title="Remover" onClick={() => handleDeleteContato(c.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {c.email    && <p><Mail size={14} /> {c.email}</p>}
                  {c.telefone && <p><Phone size={14} /> {c.telefone}</p>}
                  {c.whatsapp && (
                    <a
                      className="whatsapp-link"
                      href={whatsappUrl(
                        c.whatsapp,
                        `Olá ${c.nome.split(' ')[0]}! Aqui é o ${perfil?.nome ?? 'Nexus Educação'}. Gostaria de dar continuidade à nossa conversa${lead.produto_interesse ? ` sobre ${PRODUTO_LABEL[lead.produto_interesse]}` : ''} para ${lead.municipio}/${lead.uf}. Tudo bem?`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={14} /> Abrir WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <div><span>Comercial</span><h2>Resumo</h2></div>
          </div>
          <dl className="detail-list">
            <div><dt>Produto</dt><dd>{PRODUTO_LABEL[lead.produto_interesse] ?? 'A definir'}</dd></div>
            <div>
              <dt>Valor estimado</dt>
              <dd>{lead.valor > 0 ? lead.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'A definir'}</dd>
            </div>
            <div><dt>Probabilidade</dt><dd>{lead.probabilidade ? `${lead.probabilidade}%` : 'A definir'}</dd></div>
            <div><dt>Próxima ação</dt><dd>{lead.proximaAcao || 'Sem ação definida'}</dd></div>
            {lead.dataAcao && <div><dt>Prazo</dt><dd>{formatDate(lead.dataAcao)}</dd></div>}
          </dl>
        </article>
      </section>

      {/* Dados educacionais */}
      {(lead.nome_prefeito || lead.secretario_educacao || lead.num_alunos_estimado || lead.ideb) && (
        <section className="panel">
          <div className="panel-header">
            <div><span>Contexto</span><h2>Dados educacionais</h2></div>
          </div>
          <div className="info-grid">
            {lead.nome_prefeito        && <div><p>Prefeito(a)</p><strong>{lead.nome_prefeito}</strong></div>}
            {lead.secretario_educacao  && <div><p>Sec. de Educação</p><strong>{lead.secretario_educacao}</strong></div>}
            {lead.num_alunos_estimado  && <div><p>Alunos estimados</p><strong>{lead.num_alunos_estimado.toLocaleString('pt-BR')}</strong></div>}
            {lead.num_escolas          && <div><p>Escolas</p><strong>{lead.num_escolas}</strong></div>}
            {lead.ideb                 && <div><p>IDEB</p><strong>{lead.ideb}</strong></div>}
            {lead.saeb                 && <div><p>SAEB</p><strong>{lead.saeb}</strong></div>}
          </div>
        </section>
      )}

      {/* Interações */}
      <section className="panel">
        <div className="panel-header interactions-header">
          <div>
            <span>Histórico</span>
            <h2>
              Interações
              {sortedInteractions.length > 0 && (
                <em className="interactions-count">{sortedInteractions.length}</em>
              )}
            </h2>
          </div>
          <div className="interaction-shortcuts">
            {INTERACTION_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  className="interaction-chip"
                  style={{ '--chip-color': type.color }}
                  onClick={() => openInteractionForm(type.value)}
                >
                  <Icon size={14} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Formulário inline */}
        {formOpen && (
          <form className="interaction-form" onSubmit={handleInteractionSubmit}>
            {formError && <div className="form-alert">{formError}</div>}
            <div className="form-grid">
              <label>
                Tipo de interação
                <select name="tipo" value={interactionForm.tipo} onChange={updateInteraction}>
                  {INTERACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Contato vinculado
                <select name="contato_id" value={interactionForm.contato_id} onChange={updateInteraction}>
                  <option value="">Sem contato vinculado</option>
                  {lead.contatos.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </label>
              <label className="form-field-wide">
                Resumo *
                <textarea
                  name="resumo"
                  value={interactionForm.resumo}
                  onChange={updateInteraction}
                  placeholder="Descreva o que foi tratado, decisões tomadas, próximos passos combinados…"
                  rows="3"
                  required
                />
              </label>
              <label>
                Próxima ação combinada
                <input
                  name="proxima_acao"
                  value={interactionForm.proxima_acao}
                  onChange={updateInteraction}
                  placeholder="Ex: enviar proposta técnica"
                />
              </label>
              <label>
                Prazo
                <input
                  name="prazo_proxima_acao"
                  type="date"
                  value={interactionForm.prazo_proxima_acao}
                  onChange={updateInteraction}
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
                Cancelar
              </button>
              <Button type="submit" disabled={saving}>
                <Save size={16} />
                {saving ? 'Salvando…' : 'Salvar interação'}
              </Button>
            </div>
          </form>
        )}

        {/* Timeline */}
        {sortedInteractions.length === 0 && !formOpen ? (
          <div className="interactions-empty">
            <ArrowLeftRight size={28} />
            <p>Nenhuma interação registrada ainda.</p>
            <button type="button" className="btn btn-primary" onClick={() => openInteractionForm()}>
              Registrar primeira interação
            </button>
          </div>
        ) : (
          <div className="interaction-timeline">
            {sortedInteractions.map((item) => {
              const def = TYPE_MAP[item.tipo] ?? { label: item.tipo, icon: ArrowLeftRight, color: '#557060' };
              const Icon = def.icon;
              return (
                <article key={item.id} className="interaction-item">
                  <div className="interaction-marker" style={{ background: def.color, boxShadow: `0 0 0 4px ${def.color}22` }} />
                  <div className="interaction-card">
                    <header>
                      <div className="interaction-type-badge" style={{ background: `${def.color}15`, color: def.color }}>
                        <Icon size={13} />
                        {def.label}
                      </div>
                      <span>{formatDate(item.data)}</span>
                    </header>
                    <p>{item.resumo}</p>
                    {item.proxima_acao && (
                      <small>
                        → {item.proxima_acao}
                        {item.prazo_proxima_acao ? ` · até ${formatDate(item.prazo_proxima_acao)}` : ''}
                      </small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
