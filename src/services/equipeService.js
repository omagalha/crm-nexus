import { supabase } from './supabase.js';

export async function getEquipe() {
  const { data, error } = await supabase
    .from('perfis')
    .select('id, nome, email, perfil, ativo, created_at')
    .order('nome', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function updateMembroRole(userId, role) {
  const { error } = await supabase
    .from('perfis')
    .update({ perfil: role })
    .eq('id', userId);

  if (error) throw error;
}

export async function toggleMembroAtivo(userId, ativo) {
  const { error } = await supabase
    .from('perfis')
    .update({ ativo })
    .eq('id', userId);

  if (error) throw error;
}

export async function convidarMembro(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) throw error;
}
