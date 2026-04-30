import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PipelineColumn from '../components/PipelineColumn.jsx';
import { usePipeline } from '../hooks/useLeads.js';
import { moveLeadToEtapa } from '../services/leadsService.js';

export default function Leads() {
  const { pipeline: initialPipeline, loading } = usePipeline();
  const [pipeline, setPipeline] = useState([]);
  const draggingId = useRef(null);

  useEffect(() => {
    setPipeline(initialPipeline);
  }, [initialPipeline]);

  const handleDragStart = useCallback((leadId) => {
    draggingId.current = leadId;
  }, []);

  const handleDrop = useCallback((targetStage) => {
    const leadId = draggingId.current;
    if (!leadId) return;
    draggingId.current = null;

    setPipeline((prev) => {
      let movedLead = null;
      const next = prev.map((col) => {
        const found = col.leads.find((l) => l.id === leadId);
        if (found) {
          movedLead = { ...found, etapa: targetStage };
          return { ...col, leads: col.leads.filter((l) => l.id !== leadId) };
        }
        return col;
      });
      if (!movedLead) return prev;
      return next.map((col) =>
        col.stage === targetStage
          ? { ...col, leads: [movedLead, ...col.leads] }
          : col
      );
    });

    moveLeadToEtapa(leadId, targetStage).catch(() => {
      setPipeline(initialPipeline);
    });
  }, [initialPipeline]);

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span>Oportunidades</span>
          <h1>Pipeline de leads</h1>
          <p>Arraste os cards para mover entre etapas.</p>
        </div>
        <Link to="/leads/novo" className="btn btn-primary">+ Novo lead</Link>
      </section>

      {loading ? (
        <div className="pipeline-board">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="pipeline-column">
              <div className="skel skel-col-header" />
              <div className="skel skel-card" />
              <div className="skel skel-card" />
            </div>
          ))}
        </div>
      ) : (
        <div className="pipeline-board">
          {pipeline.map((col) => (
            <PipelineColumn
              key={col.stage}
              stage={col.stage}
              leads={col.leads}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}
