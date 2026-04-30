import { Link } from 'react-router-dom';

export default function LeadCard({ lead, onDragStart }) {
  return (
    <Link
      className="lead-card"
      to={`/leads/${lead.id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(lead.id);
      }}
      onClick={(e) => {
        if (e.currentTarget.classList.contains('dragging')) e.preventDefault();
      }}
    >
      <div className="lead-card-header">
        <div>
          <strong>{lead.municipio} / {lead.uf}</strong>
          <span>{lead.responsavel}</span>
        </div>
        <small className={`status-pill status-${lead.status}`}>{lead.status}</small>
      </div>
      <p>{lead.cargo}</p>
      <div className="lead-card-footer">
        <span>{lead.probabilidade}%</span>
        <strong>{lead.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
      </div>
    </Link>
  );
}
