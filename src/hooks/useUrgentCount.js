import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase.js';

function calcUrgent(leads) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return leads.filter((l) => {
    if (!l.proxima_acao || l.proxima_acao_concluida_em) return false;
    if (!l.data_proxima_acao) return false;
    const prazo = new Date(l.data_proxima_acao);
    prazo.setHours(0, 0, 0, 0);
    return prazo <= hoje;
  }).length;
}

async function fetchCount(setCount) {
  const { data } = await supabase
    .from('leads')
    .select('proxima_acao, data_proxima_acao, proxima_acao_concluida_em')
    .not('proxima_acao', 'is', null);
  if (data) setCount(calcUrgent(data));
}

export function useUrgentCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchCount(setCount);

    const channel = supabase
      .channel('urgent-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => fetchCount(setCount),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return count;
}
