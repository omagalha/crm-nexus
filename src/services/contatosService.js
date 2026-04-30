import { supabase } from './supabase.js';

function mapContact(raw) {
  const lead = raw.leads ?? {};

  return {
    id: raw.id,
    leadId: raw.lead_id,
    nome: raw.nome,
    cargo: raw.cargo,
    email: raw.email,
    telefone: raw.telefone,
    whatsapp: raw.whatsapp,
    ehPrincipal: raw.eh_principal,
    observacoes: raw.observacoes,
    municipio: lead.municipio ?? '',
    uf: lead.uf ?? '',
    leadStatus: lead.status ?? '',
    leadEtapa: lead.etapa ?? '',
  };
}

export async function getContatos() {
  const { data, error } = await supabase
    .from('contatos')
    .select(`
      id,
      lead_id,
      nome,
      cargo,
      email,
      telefone,
      whatsapp,
      eh_principal,
      observacoes,
      leads(id, municipio, uf, status, etapa)
    `)
    .order('nome', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapContact);
}
