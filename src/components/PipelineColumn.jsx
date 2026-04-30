import { useState } from 'react';
import LeadCard from './LeadCard.jsx';

export default function PipelineColumn({ stage, leads, onDragStart, onDrop }) {
  const [over, setOver] = useState(false);
  const total = leads.reduce((sum, lead) => sum + lead.valor, 0);

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOver(true);
  }

  function handleDrop(e) {
    e.preventDefault();
    setOver(false);
    onDrop?.(stage);
  }

  return (
    <section
      className={`pipeline-column ${over ? 'pipeline-column-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
    >
      <header>
        <div>
          <strong>{stage}</strong>
          <small>{leads.length} oportunidade{leads.length !== 1 ? 's' : ''}</small>
        </div>
        <span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
      </header>
      <div className="pipeline-list">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onDragStart={onDragStart} />
        ))}
      </div>
    </section>
  );
}
