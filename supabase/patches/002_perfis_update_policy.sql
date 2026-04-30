-- Corrige permissões da tabela perfis para a tela de Configurações.
-- Execute no SQL Editor do Supabase se aparecer erro de permissão ao salvar o nome.

grant usage on schema public to authenticated;
grant select, insert, update on public.perfis to authenticated;

drop policy if exists "perfil: edição própria" on public.perfis;
drop policy if exists "perfil: criação própria" on public.perfis;
drop policy if exists "perfil: leitura própria" on public.perfis;

create policy "perfil: edição própria" on public.perfis
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "perfil: criação própria" on public.perfis
  for insert
  with check (id = auth.uid());

create policy "perfil: leitura própria" on public.perfis
  for select
  using (id = auth.uid());
