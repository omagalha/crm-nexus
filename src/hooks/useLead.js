import { useEffect, useState } from 'react';
import { getLeadById } from '../services/leadsService.js';

export function useLead(id) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    if (!id) return;
    try {
      setLoading(true);
      setLead(await getLeadById(id));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  return { lead, loading, error, reload: load };
}
