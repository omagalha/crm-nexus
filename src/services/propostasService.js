import { leads } from '../data/mockLeads.js';

export function getPropostas() {
  return leads
    .filter((lead) => ['Proposta', 'Negociacao', 'Fechamento'].includes(lead.etapa))
    .map((lead) => ({
      id: `prop-${lead.id}`,
      municipio: lead.municipio,
      uf: lead.uf,
      valor: lead.valor,
      status: lead.etapa === 'Fechamento' ? 'Em assinatura' : 'Em analise',
      responsavel: lead.responsavel,
    }));
}
