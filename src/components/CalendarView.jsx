import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendarEvents } from '../hooks/useCalendarEvents.js';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function urgenciaClass(prazoStr) {
  if (!prazoStr) return 'cal-chip-futura';
  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  const prazo = new Date(prazoStr);
  prazo.setHours(0,0,0,0);
  const diff = Math.floor((prazo - hoje) / 86400000);
  if (diff < 0) return 'cal-chip-vencida';
  if (diff === 0) return 'cal-chip-hoje';
  return 'cal-chip-futura';
}

function buildGrid(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const ultimo   = new Date(ano, mes + 1, 0);
  const inicio   = new Date(primeiro);
  inicio.setDate(inicio.getDate() - inicio.getDay()); // recua até domingo

  const dias = [];
  const cursor = new Date(inicio);
  while (cursor <= ultimo || cursor.getDay() !== 0) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    if (dias.length > 42) break; // máx 6 semanas
  }
  return dias;
}

function getEventDateKey(event) {
  return event.start?.date ?? event.start?.dateTime?.slice(0, 10) ?? null;
}

function getEventTitle(event) {
  return event.summary || 'Evento Google Calendar';
}

export default function CalendarView({ tarefas }) {
  const navigate = useNavigate();
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const { events: googleEvents, loading: loadingGoogleEvents } = useCalendarEvents({ mes, ano });

  function prevMes() {
    if (mes === 0) { setMes(11); setAno(a => a - 1); }
    else setMes(m => m - 1);
  }
  function nextMes() {
    if (mes === 11) { setMes(0); setAno(a => a + 1); }
    else setMes(m => m + 1);
  }

  const grid = useMemo(() => buildGrid(ano, mes), [ano, mes]);

  const byDay = useMemo(() => {
    const map = {};
    for (const t of tarefas) {
      if (!t.prazo) continue;
      const key = t.prazo.slice(0, 10); // 'YYYY-MM-DD'
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [tarefas]);

  const googleByDay = useMemo(() => {
    const map = {};
    for (const event of googleEvents) {
      const key = getEventDateKey(event);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    }
    return map;
  }, [googleEvents]);

  return (
    <div className="cal-wrapper">
      {/* Navegação */}
      <div className="cal-nav">
        <button type="button" className="icon-btn" onClick={prevMes}>
          <ChevronLeft size={16} />
        </button>
        <strong className="cal-nav-title">{MESES[mes]} {ano}</strong>
        <button type="button" className="icon-btn" onClick={nextMes}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid */}
      <div className="cal-grid">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}

        {grid.map((dia, i) => {
          const key      = toDateKey(dia);
          const eHoje    = dia.getTime() === hoje.getTime();
          const outroMes = dia.getMonth() !== mes;
          const chips    = byDay[key] ?? [];
          const googleChips = googleByDay[key] ?? [];
          const visibleCrmChips = chips.slice(0, Math.min(3, chips.length));
          const visibleGoogleChips = googleChips.slice(0, Math.max(0, 4 - visibleCrmChips.length));
          const hiddenCount = chips.length + googleChips.length - visibleCrmChips.length - visibleGoogleChips.length;

          return (
            <div
              key={i}
              className={`cal-day ${eHoje ? 'cal-day-today' : ''} ${outroMes ? 'cal-day-other' : ''}`}
            >
              <span className="cal-day-num">{dia.getDate()}</span>
              <div className="cal-chips">
                {visibleCrmChips.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`cal-chip ${urgenciaClass(t.prazo)} ${t.concluidaEm ? 'cal-chip-concluida' : ''}`}
                    onClick={() => navigate(`/leads/${t.id}`)}
                    title={`${t.municipio}/${t.uf} — ${t.acao}`}
                  >
                    {t.municipio}
                  </button>
                ))}
                {visibleGoogleChips.map(event => {
                  const title = getEventTitle(event);
                  const content = (
                    <>
                      <span className="cal-chip-source">G</span>
                      {title}
                    </>
                  );

                  return event.htmlLink ? (
                    <a
                      key={event.id}
                      className="cal-chip cal-chip-google"
                      href={event.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      title={title}
                    >
                      {content}
                    </a>
                  ) : (
                    <span key={event.id} className="cal-chip cal-chip-google" title={title}>
                      {content}
                    </span>
                  );
                })}
                {hiddenCount > 0 && (
                  <span className="cal-chip-more">+{hiddenCount}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="cal-legend">
        <span><i className="cal-dot cal-dot-vencida" /> Vencida</span>
        <span><i className="cal-dot cal-dot-hoje"    /> Hoje</span>
        <span><i className="cal-dot cal-dot-futura"  /> Futura</span>
        <span><i className="cal-dot cal-dot-concluida" /> Concluída</span>
        <span><i className="cal-dot cal-dot-google" /> Google Calendar{loadingGoogleEvents ? '...' : ''}</span>
      </div>
    </div>
  );
}
