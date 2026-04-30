import { useEffect, useState } from 'react';
import { getLeads, getPipeline, getPipelineAtivos } from '../services/leadsService.js';

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setLeads(await getLeads());
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { leads, loading, error, reload: load };
}

export function usePipeline() {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPipeline().then(setPipeline).finally(() => setLoading(false));
  }, []);

  return { pipeline, loading };
}

export function usePipelineAtivos() {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPipelineAtivos().then(setPipeline).finally(() => setLoading(false));
  }, []);

  return { pipeline, loading };
}
