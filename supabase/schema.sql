-- ============================================================
-- NEXUS CRM — Schema completo
-- Cole no SQL Editor do Supabase e execute
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- PERFIS (extensão de auth.users)
-- ============================================================
create table public.perfis (
  id        uuid references auth.users(id) on delete cascade primary key,
  nome      text not null,
  email     text not null,
  perfil    text not null default 'consulta'
              check (perfil in ('administrador','diretor','comercial','administrativo','consulta')),
  ativo     boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- LEADS / MUNICÍPIOS
-- ============================================================
create table public.leads (
  id uuid default uuid_generate_v4() primary key,

  -- Dados do município
  municipio              text not null,
  uf                     char(2) not null,
  nome_prefeito          text,
  secretario_educacao    text,
  porte                  text check (porte in ('pequeno','medio','grande')),
  num_alunos_estimado    integer,
  num_escolas            integer,
  ideb                   numeric(4,2),
  saeb                   numeric(6,2),
  situacao_politica      text,
  fonte_lead             text,

  -- Dados comerciais
  produto_interesse text check (produto_interesse in (
    'simplifica_sim','lab42','coletivamente','consultoria','pacote_integrado'
  )),
  etapa text not null default 'Lead identificado' check (etapa in (
    'Lead identificado',
    'Primeiro contato realizado',
    'Reunião agendada',
    'Diagnóstico realizado',
    'Proposta em elaboração',
    'Proposta enviada',
    'Em negociação',
    'Aguardando documentação/licitação',
    'Contrato fechado',
    'Perdido / pausado'
  )),
  status text not null default 'frio'
    check (status in ('quente','morno','frio','ganho','perdido')),
  valor_estimado  numeric(12,2),
  probabilidade   integer check (probabilidade between 0 and 100),
  responsavel_id  uuid references auth.users(id),

  -- Dados jurídicos / licitação
  potencial_contratacao        text,
  risco_juridico               text,
  possibilidade_inexigibilidade boolean default false,
  status_termo_referencia      text,
  status_proposta_tecnica      text,
  status_documentacao          text,

  -- Relacionamento
  historico_relacionamento  text,
  observacoes_estrategicas  text,

  -- Próxima ação
  proxima_acao      text,
  data_proxima_acao date,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CONTATOS
-- ============================================================
create table public.contatos (
  id      uuid default uuid_generate_v4() primary key,
  lead_id uuid not null references public.leads(id) on delete cascade,

  nome    text not null,
  cargo   text check (cargo in (
    'prefeito','secretario_educacao','subsecretario',
    'coordenador_pedagogico','diretor_administrativo',
    'responsavel_compras','assessor_politico','outro'
  )),
  email       text,
  telefone    text,
  whatsapp    text,
  eh_principal boolean default false,
  observacoes text,

  created_at timestamptz default now()
);

-- ============================================================
-- INTERAÇÕES
-- ============================================================
create table public.interacoes (
  id         uuid default uuid_generate_v4() primary key,
  lead_id    uuid not null references public.leads(id) on delete cascade,
  contato_id uuid references public.contatos(id),

  tipo text not null check (tipo in (
    'ligacao','whatsapp','email',
    'reuniao_presencial','reuniao_online',
    'envio_proposta','envio_material',
    'retorno_recebido','pendencia'
  )),
  data            timestamptz default now(),
  responsavel_id  uuid references auth.users(id),
  resumo          text not null,
  proxima_acao    text,
  prazo_proxima_acao date,

  created_at timestamptz default now()
);

-- ============================================================
-- PROPOSTAS
-- ============================================================
create table public.propostas (
  id      uuid default uuid_generate_v4() primary key,
  lead_id uuid not null references public.leads(id) on delete cascade,

  produto text not null check (produto in (
    'simplifica_sim','lab42','coletivamente','consultoria','pacote_integrado'
  )),
  valor_estimado       numeric(12,2),
  num_alunos_atendidos integer,
  status text not null default 'em_elaboracao' check (status in (
    'em_elaboracao','enviada','em_analise',
    'em_negociacao','aceita','recusada','expirada'
  )),
  data_envio           date,
  validade_ate         date,
  arquivo_url          text,
  observacoes_juridicas   text,
  observacoes_comerciais  text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TAREFAS
-- ============================================================
create table public.tarefas (
  id      uuid default uuid_generate_v4() primary key,
  lead_id uuid references public.leads(id) on delete set null,

  titulo         text not null,
  descricao      text,
  responsavel_id uuid references auth.users(id),
  prioridade     text not null default 'media'
                   check (prioridade in ('alta','media','baixa')),
  status         text not null default 'pendente'
                   check (status in ('pendente','em_andamento','concluida','cancelada')),
  prazo          date,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at     before update on public.leads
  for each row execute function public.set_updated_at();
create trigger propostas_updated_at before update on public.propostas
  for each row execute function public.set_updated_at();
create trigger tarefas_updated_at   before update on public.tarefas
  for each row execute function public.set_updated_at();

-- ============================================================
-- TRIGGER: criar perfil ao cadastrar usuário no Auth
-- ============================================================
create or replace function public.criar_perfil_usuario()
returns trigger as $$
begin
  insert into public.perfis (id, nome, email, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'perfil', 'consulta')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.criar_perfil_usuario();

-- ============================================================
-- ÍNDICES
-- ============================================================
create index leads_etapa_idx        on public.leads(etapa);
create index leads_status_idx       on public.leads(status);
create index leads_responsavel_idx  on public.leads(responsavel_id);
create index leads_uf_idx           on public.leads(uf);
create index contatos_lead_idx      on public.contatos(lead_id);
create index interacoes_lead_idx    on public.interacoes(lead_id);
create index interacoes_data_idx    on public.interacoes(data desc);
create index propostas_lead_idx     on public.propostas(lead_id);
create index tarefas_responsavel_idx on public.tarefas(responsavel_id);
create index tarefas_prazo_idx      on public.tarefas(prazo);

-- ============================================================
-- IDEB HISTÓRICO
-- ============================================================
create table public.ideb_historico (
  id            uuid default uuid_generate_v4() primary key,
  lead_id       uuid references public.leads(id) on delete cascade not null,
  ano           integer not null,
  anos_iniciais numeric(4,2),
  anos_finais   numeric(4,2),
  created_at    timestamptz default now(),
  unique(lead_id, ano)
);

create index ideb_lead_idx on public.ideb_historico(lead_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.perfis         enable row level security;
alter table public.leads          enable row level security;
alter table public.contatos       enable row level security;
alter table public.interacoes     enable row level security;
alter table public.propostas      enable row level security;
alter table public.tarefas        enable row level security;
alter table public.ideb_historico enable row level security;

-- Helper: retorna perfil do usuário logado
create or replace function public.meu_perfil()
returns text as $$
  select perfil from public.perfis where id = auth.uid();
$$ language sql security definer stable;

-- PERFIS
create policy "perfil: leitura" on public.perfis
  for select using (id = auth.uid() or public.meu_perfil() in ('administrador','diretor'));
create policy "perfil: edição própria" on public.perfis
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "perfil: edição por admin" on public.perfis
  for update using (public.meu_perfil() in ('administrador','diretor'))
  with check (public.meu_perfil() in ('administrador','diretor'));

-- LEADS
create policy "leads: leitura" on public.leads
  for select using (auth.role() = 'authenticated');
create policy "leads: escrita" on public.leads
  for all using (public.meu_perfil() in ('administrador','diretor','comercial'));

-- CONTATOS
create policy "contatos: leitura" on public.contatos
  for select using (auth.role() = 'authenticated');
create policy "contatos: escrita" on public.contatos
  for all using (public.meu_perfil() in ('administrador','diretor','comercial'));

-- INTERAÇÕES
create policy "interacoes: leitura" on public.interacoes
  for select using (auth.role() = 'authenticated');
create policy "interacoes: escrita" on public.interacoes
  for all using (public.meu_perfil() in ('administrador','diretor','comercial'));

-- PROPOSTAS
create policy "propostas: leitura" on public.propostas
  for select using (auth.role() = 'authenticated');
create policy "propostas: escrita" on public.propostas
  for all using (public.meu_perfil() in ('administrador','diretor','comercial','administrativo'));

-- TAREFAS
create policy "tarefas: leitura" on public.tarefas
  for select using (auth.role() = 'authenticated');
create policy "tarefas: escrita" on public.tarefas
  for all using (public.meu_perfil() in ('administrador','diretor','comercial','administrativo'));

-- IDEB HISTÓRICO
create policy "ideb: leitura" on public.ideb_historico
  for select using (auth.role() = 'authenticated');
create policy "ideb: escrita" on public.ideb_historico
  for all using (public.meu_perfil() in ('administrador','diretor','comercial'));
