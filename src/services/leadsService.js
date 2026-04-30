import { supabase } from './supabase.js';

const PIPELINE_STAGES = [
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

function mapLead(raw) {
  const principal = raw.contatos?.find((c) => c.eh_principal) ?? raw.contatos?.[0];
  return {
    id: raw.id,
    municipio: raw.municipio,
    uf: raw.uf,
    etapa: raw.etapa,
    status: raw.status,
    valor: raw.valor_estimado ?? 0,
    probabilidade: raw.probabilidade ?? 0,
    proximaAcao: raw.proxima_acao ?? '',
    dataAcao: raw.data_proxima_acao ?? '',
    responsavel: principal?.nome ?? '—',
    cargo: principal?.cargo ?? '',
    email: principal?.email ?? '',
    telefone: principal?.telefone ?? '',
    // campos educacionais
    nome_prefeito: raw.nome_prefeito,
    secretario_educacao: raw.secretario_educacao,
    produto_interesse: raw.produto_interesse,
    num_alunos_estimado: raw.num_alunos_estimado,
    num_escolas: raw.num_escolas,
    ideb: raw.ideb,
    saeb: raw.saeb,
    porte: raw.porte,
    situacao_politica: raw.situacao_politica,
    fonte_lead: raw.fonte_lead,
    // jurídico
    potencial_contratacao: raw.potencial_contratacao,
    risco_juridico: raw.risco_juridico,
    possibilidade_inexigibilidade: raw.possibilidade_inexigibilidade,
    status_termo_referencia: raw.status_termo_referencia,
    status_proposta_tecnica: raw.status_proposta_tecnica,
    status_documentacao: raw.status_documentacao,
    observacoes_estrategicas: raw.observacoes_estrategicas,
    historico_relacionamento: raw.historico_relacionamento,
    gcalEventId: raw.gcal_event_id ?? null,
    // listas relacionadas
    contatos: raw.contatos ?? [],
    interacoes: raw.interacoes ?? [],
    propostas: raw.propostas ?? [],
    created_at: raw.created_at,
  };
}

export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*, contatos(id, nome, cargo, email, telefone, whatsapp, eh_principal)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapLead);
}

export async function getLeadById(id) {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      contatos(id, nome, cargo, email, telefone, whatsapp, eh_principal, observacoes),
      interacoes(id, tipo, data, resumo, proxima_acao, prazo_proxima_acao, responsavel_id),
      propostas(id, produto, valor_estimado, num_alunos_atendidos, status, data_envio, validade_ate)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapLead(data);
}

export async function getPipelineStages() {
  return PIPELINE_STAGES;
}

export async function getPipeline() {
  const leads = await getLeads();
  return PIPELINE_STAGES.map((stage) => ({
    stage,
    leads: leads.filter((l) => l.etapa === stage),
  }));
}

export async function getPipelineAtivos() {
  const leads = await getLeads();
  const excluidos = ['Contrato fechado', 'Perdido / pausado'];
  return PIPELINE_STAGES
    .filter((s) => !excluidos.includes(s))
    .map((stage) => ({
      stage,
      leads: leads.filter((l) => l.etapa === stage),
    }));
}

function emptyToNull(value) {
  return value === '' || value === undefined ? null : value;
}

function numberOrNull(value) {
  if (value === '' || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function buildLeadPayload(payload) {
  return {
    municipio: payload.municipio.trim(),
    uf: payload.uf.trim().toUpperCase(),
    nome_prefeito: emptyToNull(payload.nome_prefeito?.trim()),
    secretario_educacao: emptyToNull(payload.secretario_educacao?.trim()),
    porte: emptyToNull(payload.porte),
    num_alunos_estimado: numberOrNull(payload.num_alunos_estimado),
    num_escolas: numberOrNull(payload.num_escolas),
    ideb: numberOrNull(payload.ideb),
    saeb: numberOrNull(payload.saeb),
    situacao_politica: emptyToNull(payload.situacao_politica?.trim()),
    fonte_lead: emptyToNull(payload.fonte_lead?.trim()),
    produto_interesse: emptyToNull(payload.produto_interesse),
    etapa: payload.etapa || 'Lead identificado',
    status: payload.status || 'frio',
    valor_estimado: numberOrNull(payload.valor_estimado),
    probabilidade: numberOrNull(payload.probabilidade),
    potencial_contratacao: emptyToNull(payload.potencial_contratacao?.trim()),
    risco_juridico: emptyToNull(payload.risco_juridico?.trim()),
    possibilidade_inexigibilidade: Boolean(payload.possibilidade_inexigibilidade),
    status_termo_referencia: emptyToNull(payload.status_termo_referencia?.trim()),
    status_proposta_tecnica: emptyToNull(payload.status_proposta_tecnica?.trim()),
    status_documentacao: emptyToNull(payload.status_documentacao?.trim()),
    historico_relacionamento: emptyToNull(payload.historico_relacionamento?.trim()),
    observacoes_estrategicas: emptyToNull(payload.observacoes_estrategicas?.trim()),
    proxima_acao: emptyToNull(payload.proxima_acao?.trim()),
    data_proxima_acao: emptyToNull(payload.data_proxima_acao),
  };
}

function buildContactPayload(leadId, payload) {
  return {
    lead_id: leadId,
    nome: payload.contato_nome.trim(),
    cargo: emptyToNull(payload.contato_cargo),
    email: emptyToNull(payload.contato_email?.trim()),
    telefone: emptyToNull(payload.contato_telefone?.trim()),
    whatsapp: emptyToNull(payload.contato_whatsapp?.trim()),
    eh_principal: true,
    observacoes: emptyToNull(payload.contato_observacoes?.trim()),
  };
}

export async function createLead(payload) {
  const leadPayload = buildLeadPayload(payload);

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert(leadPayload)
    .select()
    .single();

  if (leadError) throw leadError;

  if (payload.contato_nome?.trim()) {
    const { error: contactError } = await supabase.from('contatos').insert(buildContactPayload(lead.id, payload));

    if (contactError) throw contactError;
  }

  return mapLead({ ...lead, contatos: [] });
}

export async function updateLead(leadId, payload) {
  const leadPayload = buildLeadPayload(payload);

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .update(leadPayload)
    .eq('id', leadId)
    .select()
    .single();

  if (leadError) throw leadError;

  if (payload.contato_nome?.trim()) {
    const contactPayload = buildContactPayload(leadId, payload);
    const contactId = emptyToNull(payload.contato_id);

    const contactQuery = contactId
      ? supabase.from('contatos').update(contactPayload).eq('id', contactId)
      : supabase.from('contatos').insert(contactPayload);

    const { error: contactError } = await contactQuery;
    if (contactError) throw contactError;
  }

  return mapLead({ ...lead, contatos: [] });
}

const ETAPA_STATUS_AUTO = {
  'Contrato fechado': 'ganho',
  'Perdido / pausado': 'perdido',
};

export async function moveLeadToEtapa(leadId, etapa) {
  const update = { etapa };
  const autoStatus = ETAPA_STATUS_AUTO[etapa];
  if (autoStatus) update.status = autoStatus;

  const { error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', leadId);
  if (error) throw error;
}

export async function addContato(leadId, payload) {
  const { data, error } = await supabase.from('contatos').insert({
    lead_id: leadId,
    nome: payload.nome.trim(),
    cargo: emptyToNull(payload.cargo),
    email: emptyToNull(payload.email?.trim()),
    telefone: emptyToNull(payload.telefone?.trim()),
    whatsapp: emptyToNull(payload.whatsapp?.trim()),
    eh_principal: Boolean(payload.eh_principal),
    observacoes: emptyToNull(payload.observacoes?.trim()),
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateContato(contatoId, payload) {
  const { data, error } = await supabase.from('contatos').update({
    nome: payload.nome.trim(),
    cargo: emptyToNull(payload.cargo),
    email: emptyToNull(payload.email?.trim()),
    telefone: emptyToNull(payload.telefone?.trim()),
    whatsapp: emptyToNull(payload.whatsapp?.trim()),
    eh_principal: Boolean(payload.eh_principal),
    observacoes: emptyToNull(payload.observacoes?.trim()),
  }).eq('id', contatoId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteContato(contatoId) {
  const { error } = await supabase.from('contatos').delete().eq('id', contatoId);
  if (error) throw error;
}

export async function deleteLead(leadId) {
  const { error } = await supabase.from('leads').delete().eq('id', leadId);
  if (error) throw error;
}

export async function getPropostas() {
  const { data, error } = await supabase
    .from('propostas')
    .select(`
      id, produto, valor_estimado, num_alunos_atendidos, status, data_envio, validade_ate,
      leads(id, municipio, uf, status)
    `)
    .order('data_envio', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    produto: p.produto,
    valor: p.valor_estimado ?? 0,
    numAlunos: p.num_alunos_atendidos ?? 0,
    status: p.status,
    dataEnvio: p.data_envio,
    validadeAte: p.validade_ate,
    leadId: p.leads?.id,
    municipio: p.leads?.municipio ?? '—',
    uf: p.leads?.uf ?? '',
    statusLead: p.leads?.status,
  }));
}

export async function setLeadGcalEventId(leadId, eventId) {
  const { error } = await supabase
    .from('leads')
    .update({ gcal_event_id: eventId ?? null })
    .eq('id', leadId);
  if (error) throw error;
}

export async function createInteraction(leadId, payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id ?? null;

  const interactionPayload = {
    lead_id: leadId,
    contato_id: emptyToNull(payload.contato_id),
    tipo: payload.tipo,
    responsavel_id: userId,
    resumo: payload.resumo.trim(),
    proxima_acao: emptyToNull(payload.proxima_acao?.trim()),
    prazo_proxima_acao: emptyToNull(payload.prazo_proxima_acao),
  };

  const { data, error } = await supabase
    .from('interacoes')
    .insert(interactionPayload)
    .select()
    .single();

  if (error) throw error;

  if (interactionPayload.proxima_acao || interactionPayload.prazo_proxima_acao) {
    const { error: leadError } = await supabase
      .from('leads')
      .update({
        proxima_acao: interactionPayload.proxima_acao,
        data_proxima_acao: interactionPayload.prazo_proxima_acao,
      })
      .eq('id', leadId);

    if (leadError) throw leadError;
  }

  return data;
}
