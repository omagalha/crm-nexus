import { useEffect, useState } from 'react';
import {
  isCalendarConnected,
  listCalendarEvents,
  onCalendarConnectionChange,
} from '../services/googleCalendarService.js';

export function useCalendarEvents({ mes, ano }) {
  const [connected, setConnected] = useState(isCalendarConnected);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onCalendarConnectionChange(setConnected);
  }, []);

  useEffect(() => {
    let active = true;

    if (!connected) {
      setEvents([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    listCalendarEvents({ mes, ano })
      .then((items) => {
        if (active) setEvents(items);
      })
      .catch((err) => {
        console.error('[Google Calendar] Erro ao listar eventos:', err);
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ano, connected, mes]);

  return { events, loading };
}
