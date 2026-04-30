import { ArrowLeft, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { createLead, getLeadById, updateLead } from '../services/leadsService.js';

const etapas = [
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

const produtos = [
  { value: '', label: 'Selecione' },
  { value: 'simplifica_sim', label: 'Simplifica Sim' },
  { value: 'lab42', label: 'LAB 42' },
  { value: 'coletivamente', label: 'Coletivamente' },
  { value: 'consultoria', label: 'Consultoria Educacional' },
  { value: 'pacote_integrado', label: 'Pacote integrado Nexus' },
];

const cargos = [
  { value: '', label: 'Selecione' },
  { value: 'prefeito', label: 'Prefeito(a)' },
  { value: 'secretario_educacao', label: 'Secretário(a) de Educação' },
  { value: 'subsecretario', label: 'Subsecretário(a)' },
  { value: 'coordenador_pedagogico', label: 'Coordenador(a) Pedagógico(a)' },
  { value: 'diretor_administrativo', label: 'Diretor(a) Administrativo(a)' },
  { value: 'responsavel_compras', label: 'Responsável por Compras' },
  { value: 'assessor_politico', label: 'Assessor(a) Político(a)' },
  { value: 'outro', label: 'Outro' },
];

const initialForm = {
  municipio: '',
  uf: '',
  nome_prefeito: '',
  secretario_educacao: '',
  porte: '',
  num_alunos_estimado: '',
  num_escolas: '',
  ideb: '',
  saeb: '',
  situacao_politica: '',
  fonte_lead: '',
  produto_interesse: '',
  etapa: 'Lead identificado',
  status: 'frio',
  valor_estimado: '',
  probabilidade: 25,
  potencial_contratacao: '',
  risco_juridico: '',
  possibilidade_inexigibilidade: false,
  status_termo_referencia: '',
  status_proposta_tecnica: '',
  status_documentacao: '',
  historico_relacionamento: '',
  observacoes_estrategicas: '',
  proxima_acao: '',
  data_proxima_acao: '',
  contato_id: '',
  contato_nome: '',
  contato_cargo: '',
  contato_email: '',
  contato_telefone: '',
  contato_whatsapp: '',
  contato_observacoes: '',
};

function toInputDate(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function leadToForm(lead) {
  const principal = lead.contatos?.find((contact) => contact.eh_principal) ?? lead.contatos?.[0];

  return {
    municipio: lead.municipio ?? '',
    uf: lead.uf ?? '',
    nome_prefeito: lead.nome_prefeito ?? '',
    secretario_educacao: lead.secretario_educacao ?? '',
    porte: lead.porte ?? '',
    num_alunos_estimado: lead.num_alunos_estimado ?? '',
    num_escolas: lead.num_escolas ?? '',
    ideb: lead.ideb ?? '',
    saeb: lead.saeb ?? '',
    situacao_politica: lead.situacao_politica ?? '',
    fonte_lead: lead.fonte_lead ?? '',
    produto_interesse: lead.produto_interesse ?? '',
    etapa: lead.etapa ?? 'Lead identificado',
    status: lead.status ?? 'frio',
    valor_estimado: lead.valor ?? '',
    probabilidade: lead.probabilidade ?? 25,
    potencial_contratacao: lead.potencial_contratacao ?? '',
    risco_juridico: lead.risco_juridico ?? '',
    possibilidade_inexigibilidade: Boolean(lead.possibilidade_inexigibilidade),
    status_termo_referencia: lead.status_termo_referencia ?? '',
    status_proposta_tecnica: lead.status_proposta_tecnica ?? '',
    status_documentacao: lead.status_documentacao ?? '',
    historico_relacionamento: lead.historico_relacionamento ?? '',
    observacoes_estrategicas: lead.observacoes_estrategicas ?? '',
    proxima_acao: lead.proximaAcao ?? '',
    data_proxima_acao: toInputDate(lead.dataAcao),
    contato_id: principal?.id ?? '',
    contato_nome: principal?.nome ?? '',
    contato_cargo: principal?.cargo ?? '',
    contato_email: principal?.email ?? '',
    contato_telefone: principal?.telefone ?? '',
    contato_whatsapp: principal?.whatsapp ?? '',
    contato_observacoes: principal?.observacoes ?? '',
  };
}

export default function LeadForm() {
  const navigate = useNavigate();
  const { leadId } = useParams();
  const isEditing = Boolean(leadId);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadLead() {
      if (!isEditing) return;

      try {
        setLoading(true);
        const lead = await getLeadById(leadId);
        if (active) setForm(leadToForm(lead));
      } catch (err) {
        if (active) setError(err.message || 'Não foi possível carregar o lead.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLead();

    return () => {
      active = false;
    };
  }, [isEditing, leadId]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const lead = isEditing ? await updateLead(leadId, form) : await createLead(form);
      navigate(`/leads/${lead.id}`);
    } catch (err) {
      setError(err.message || `Não foi possível ${isEditing ? 'atualizar' : 'cadastrar'} o lead.`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-stack">
        <div className="skel skel-hero-bar" />
        <div className="skel skel-panel" />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Link className="back-link" to={isEditing ? `/leads/${leadId}` : '/leads'}>
        <ArrowLeft size={18} />
        {isEditing ? 'Voltar para detalhes' : 'Voltar para leads'}
      </Link>

      <section className="page-heading">
        <div>
          <span>{isEditing ? 'Edição de cadastro' : 'Novo cadastro'}</span>
          <h1>{isEditing ? 'Editar lead municipal' : 'Novo lead municipal'}</h1>
          <p>
            {isEditing
              ? 'Atualize dados do município, contato principal, potencial comercial e próximas ações.'
              : 'Registre o município, contato principal, potencial comercial e próximas ações.'}
          </p>
        </div>
      </section>

      <form className="lead-form" onSubmit={handleSubmit}>
        {error && <div className="form-alert">{error}</div>}

        {/* 01 — Município */}
        <section className="form-section">
          <div className="form-section-title">
            <span>01</span>
            <div>
              <h2>Município</h2>
              <p>Dados institucionais e educacionais do território.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Município *
              <input name="municipio" value={form.municipio} onChange={updateField} required />
            </label>
            <label>
              UF *
              <input name="uf" value={form.uf} onChange={updateField} maxLength="2" required className="input-short" />
            </label>
            <label>
              Nome do prefeito(a)
              <input name="nome_prefeito" value={form.nome_prefeito} onChange={updateField} />
            </label>
            <label>
              Secretário(a) de Educação
              <input name="secretario_educacao" value={form.secretario_educacao} onChange={updateField} />
            </label>
            <label>
              Porte do município
              <select name="porte" value={form.porte} onChange={updateField}>
                <option value="">Selecione</option>
                <option value="pequeno">Pequeno (até 30 mil alunos)</option>
                <option value="medio">Médio (30–100 mil alunos)</option>
                <option value="grande">Grande (acima de 100 mil alunos)</option>
              </select>
            </label>
            <label>
              Fonte do lead
              <input name="fonte_lead" value={form.fonte_lead} onChange={updateField} placeholder="Ex: indicação, evento, pesquisa…" />
            </label>
            <label>
              Alunos estimados
              <input name="num_alunos_estimado" type="number" min="0" value={form.num_alunos_estimado} onChange={updateField} />
            </label>
            <label>
              Número de escolas
              <input name="num_escolas" type="number" min="0" value={form.num_escolas} onChange={updateField} />
            </label>
            <label>
              IDEB
              <input name="ideb" type="number" min="0" max="10" step="0.01" value={form.ideb} onChange={updateField} placeholder="0,00 – 10,00" />
            </label>
            <label>
              SAEB
              <input name="saeb" type="number" min="0" step="0.01" value={form.saeb} onChange={updateField} />
            </label>
          </div>
        </section>

        {/* 02 — Contato principal */}
        <section className="form-section">
          <div className="form-section-title">
            <span>02</span>
            <div>
              <h2>Contato principal</h2>
              <p>Interlocutor inicial para o relacionamento comercial.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Nome completo
              <input name="contato_nome" value={form.contato_nome} onChange={updateField} />
            </label>
            <label>
              Cargo
              <select name="contato_cargo" value={form.contato_cargo} onChange={updateField}>
                {cargos.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label>
              E-mail
              <input name="contato_email" type="email" value={form.contato_email} onChange={updateField} />
            </label>
            <label>
              Telefone
              <input name="contato_telefone" value={form.contato_telefone} onChange={updateField} placeholder="(00) 00000-0000" />
            </label>
            <label>
              WhatsApp
              <input name="contato_whatsapp" value={form.contato_whatsapp} onChange={updateField} placeholder="(00) 00000-0000" />
            </label>
            <label>
              Observações
              <input name="contato_observacoes" value={form.contato_observacoes} onChange={updateField} />
            </label>
          </div>
        </section>

        {/* 03 — Comercial */}
        <section className="form-section">
          <div className="form-section-title">
            <span>03</span>
            <div>
              <h2>Comercial</h2>
              <p>Etapa, produto de interesse, valor estimado e próxima ação.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Produto de interesse
              <select name="produto_interesse" value={form.produto_interesse} onChange={updateField}>
                {produtos.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
            <label>
              Etapa atual
              <select name="etapa" value={form.etapa} onChange={updateField}>
                {etapas.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select name="status" value={form.status} onChange={updateField}>
                <option value="frio">Frio</option>
                <option value="morno">Morno</option>
                <option value="quente">Quente</option>
                <option value="ganho">Ganho</option>
                <option value="perdido">Perdido</option>
              </select>
            </label>
            <label>
              Valor estimado (R$)
              <input name="valor_estimado" type="number" min="0" step="0.01" value={form.valor_estimado} onChange={updateField} />
            </label>
            <label>
              Probabilidade de fechamento (%)
              <input name="probabilidade" type="number" min="0" max="100" value={form.probabilidade} onChange={updateField} />
            </label>
            <label>
              Data da próxima ação
              <input name="data_proxima_acao" type="date" value={form.data_proxima_acao} onChange={updateField} />
            </label>
            <label className="form-field-wide">
              Próxima ação
              <input name="proxima_acao" value={form.proxima_acao} onChange={updateField} placeholder="Ex: Enviar proposta, agendar reunião…" />
            </label>
            <label className="form-field-wide">
              Situação política
              <textarea name="situacao_politica" value={form.situacao_politica} onChange={updateField} rows="3" placeholder="Contexto político do município, alianças, eleições…" />
            </label>
          </div>
        </section>

        {/* 04 — Jurídico e estratégia */}
        <section className="form-section">
          <div className="form-section-title">
            <span>04</span>
            <div>
              <h2>Jurídico e estratégia</h2>
              <p>Riscos, documentação e observações para qualificação do lead.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Potencial de contratação
              <input name="potencial_contratacao" value={form.potencial_contratacao} onChange={updateField} placeholder="Ex: alto, médio, baixo…" />
            </label>
            <label>
              Risco jurídico / licitação
              <input name="risco_juridico" value={form.risco_juridico} onChange={updateField} />
            </label>
            <label>
              Status do termo de referência
              <input name="status_termo_referencia" value={form.status_termo_referencia} onChange={updateField} />
            </label>
            <label>
              Status da proposta técnica
              <input name="status_proposta_tecnica" value={form.status_proposta_tecnica} onChange={updateField} />
            </label>
            <label>
              Status da documentação
              <input name="status_documentacao" value={form.status_documentacao} onChange={updateField} />
            </label>
            <label className="checkbox-field">
              <input
                name="possibilidade_inexigibilidade"
                type="checkbox"
                checked={form.possibilidade_inexigibilidade}
                onChange={updateField}
              />
              Possibilidade de inexigibilidade
            </label>
            <label className="form-field-wide">
              Histórico de relacionamento
              <textarea name="historico_relacionamento" value={form.historico_relacionamento} onChange={updateField} rows="3" />
            </label>
            <label className="form-field-wide">
              Observações estratégicas
              <textarea name="observacoes_estrategicas" value={form.observacoes_estrategicas} onChange={updateField} rows="3" />
            </label>
          </div>
        </section>

        <div className="form-actions">
          <Link className="btn btn-ghost" to={isEditing ? `/leads/${leadId}` : '/leads'}>Cancelar</Link>
          <Button type="submit" disabled={saving}>
            <Save size={18} />
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Salvar lead'}
          </Button>
        </div>
      </form>
    </div>
  );
}
