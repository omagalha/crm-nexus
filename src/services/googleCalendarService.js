const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const TOKEN_KEY = 'nexus_gcal_token';
const TOKEN_EXP_KEY = 'nexus_gcal_token_exp';

let _tokenClient = null;
let _onConnectChange = null;

// ── Token storage (sessionStorage — expira ao fechar a aba) ──

function saveToken(token, expiresIn) {
  const exp = Date.now() + (Number(expiresIn) * 1000) - 60_000; // 1 min de margem
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXP_KEY, String(exp));
}

function loadToken() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const exp   = Number(sessionStorage.getItem(TOKEN_EXP_KEY) ?? 0);
  if (token && Date.now() < exp) return token;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXP_KEY);
  return null;
}

function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXP_KEY);
}

// ── API pública ──

export function isCalendarConnected() {
  return !!loadToken();
}

/** Registra callback chamado quando estado de conexão muda. */
export function onCalendarConnectionChange(cb) {
  _onConnectChange = cb;
}

/** Abre o popup de autorização Google. */
export function connectCalendar() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID não definido no .env');
  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services ainda não carregou. Aguarde e tente novamente.');
  }

  if (!_tokenClient) {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback(response) {
        if (response.error) {
          console.error('[Google Calendar] OAuth error:', response.error);
          return;
        }
        saveToken(response.access_token, response.expires_in ?? 3600);
        _onConnectChange?.(true);
      },
    });
  }

  _tokenClient.requestAccessToken({ prompt: '' });
}

/** Revoga o token e limpa a sessão. */
export function disconnectCalendar() {
  const token = loadToken();
  if (token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(token);
  }
  clearToken();
  _tokenClient = null;
  _onConnectChange?.(false);
}

// ── Chamadas à API Calendar ──

async function apiRequest(method, path, body) {
  const token = loadToken();
  if (!token) throw new Error('Google Calendar não conectado.');

  const res = await fetch(`${CALENDAR_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    _onConnectChange?.(false);
    throw new Error('Sessão Google expirou. Reconecte o Google Calendar em Configurações.');
  }

  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Google Calendar API: ${res.status}`);
  return res.json();
}

function buildEvent(lead) {
  const date = lead.dataAcao; // 'YYYY-MM-DD'
  return {
    summary: `[Nexus CRM] ${lead.municipio}/${lead.uf} — ${lead.proximaAcao}`,
    description: [
      `Município: ${lead.municipio}/${lead.uf}`,
      lead.produto_interesse ? `Produto: ${lead.produto_interesse}` : '',
      lead.valor ? `Valor estimado: R$ ${Number(lead.valor).toLocaleString('pt-BR')}` : '',
    ].filter(Boolean).join('\n'),
    start: { date },
    end: { date },
    reminders: {
      useDefault: false,
      overrides: [{ method: 'popup', minutes: 60 }],
    },
  };
}

export async function createCalendarEvent(lead) {
  if (!loadToken() || !lead.dataAcao || !lead.proximaAcao) return null;
  const event = await apiRequest('POST', '/calendars/primary/events', buildEvent(lead));
  return event?.id ?? null;
}

export async function updateCalendarEvent(eventId, lead) {
  if (!loadToken() || !eventId) return;
  await apiRequest('PUT', `/calendars/primary/events/${eventId}`, buildEvent(lead));
}

export async function deleteCalendarEvent(eventId) {
  if (!loadToken() || !eventId) return;
  await apiRequest('DELETE', `/calendars/primary/events/${eventId}`);
}

/**
 * Cria, atualiza ou exclui o evento de calendário com base no estado atual da ação.
 * Retorna o eventId resultante (ou null se excluído/não criado).
 */
export async function syncLeadCalendar(lead, prevEventId) {
  if (!loadToken()) return prevEventId ?? null;

  const hasAction = !!(lead.proximaAcao && lead.dataAcao);

  if (!hasAction) {
    if (prevEventId) await deleteCalendarEvent(prevEventId);
    return null;
  }

  if (prevEventId) {
    await updateCalendarEvent(prevEventId, lead);
    return prevEventId;
  }

  return createCalendarEvent(lead);
}
