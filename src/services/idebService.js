import { supabase } from './supabase.js';

export async function getIdebHistorico(leadId) {
  const { data, error } = await supabase
    .from('ideb_historico')
    .select('*')
    .eq('lead_id', leadId)
    .order('ano', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertIdebEntry(leadId, { ano, anos_iniciais, anos_finais }) {
  const { data, error } = await supabase
    .from('ideb_historico')
    .upsert(
      { lead_id: leadId, ano, anos_iniciais, anos_finais },
      { onConflict: 'lead_id,ano' }
    )
    .select('*');
  if (error) throw error;
  return data[0];
}

export async function deleteIdebEntry(id) {
  const { error } = await supabase
    .from('ideb_historico')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
