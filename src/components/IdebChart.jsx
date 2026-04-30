import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { deleteIdebEntry, getIdebHistorico, upsertIdebEntry } from '../services/idebService.js';

const COLOR_INICIAIS = '#1a9940';
const COLOR_FINAIS   = '#3b82f6';

function fmt(v) {
  return v != null ? Number(v).toFixed(2) : '–';
}

function newRow() {
  return { _id: crypto.randomUUID(), ano: '', anos_iniciais: '', anos_finais: '' };
}

export default function IdebChart({ leadId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [rows, setRows] = useState([newRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getIdebHistorico(leadId)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [leadId]);

  function updateRow(id, key, value) {
    setRows((prev) => prev.map((r) => r._id === id ? { ...r, [key]: value } : r));
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(id) {
    setRows((prev) => prev.length === 1 ? prev : prev.filter((r) => r._id !== id));
  }

  function openAdding() {
    setRows([newRow()]);
    setError(null);
    setAdding(true);
  }

  function closeAdding() {
    setAdding(false);
    setRows([newRow()]);
    setError(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    const valid = rows.filter((r) => r.ano !== '');
    if (valid.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await Promise.all(
        valid.map((r) =>
          upsertIdebEntry(leadId, {
            ano:           parseInt(r.ano, 10),
            anos_iniciais: r.anos_iniciais !== '' ? parseFloat(r.anos_iniciais) : null,
            anos_finais:   r.anos_finais   !== '' ? parseFloat(r.anos_finais)   : null,
          })
        )
      );
      setEntries((prev) => {
        let next = [...prev];
        for (const s of saved) {
          const idx = next.findIndex((e) => e.ano === s.ano);
          if (idx >= 0) next[idx] = s;
          else next.push(s);
        }
        return next.sort((a, b) => a.ano - b.ano);
      });
      closeAdding();
    } catch (err) {
      setError(err.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteIdebEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err.message || 'Não foi possível remover.');
    }
  }

  const chartData = entries.map((e) => ({
    ano:             String(e.ano),
    'Anos Iniciais': e.anos_iniciais != null ? Number(e.anos_iniciais) : null,
    'Anos Finais':   e.anos_finais   != null ? Number(e.anos_finais)   : null,
  }));

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span>Indicadores</span>
          <h2>Evolução do IDEB</h2>
        </div>
        {!adding && (
          <button type="button" className="icon-btn" title="Adicionar anos" onClick={openAdding}>
            <Plus size={14} />
          </button>
        )}
      </div>

      {error && <p className="ideb-error">{error}</p>}

      {adding && (
        <form onSubmit={handleSave} className="ideb-add-form">
          <table className="ideb-input-table">
            <thead>
              <tr>
                <th>Ano</th>
                <th style={{ color: COLOR_INICIAIS }}>Anos Iniciais</th>
                <th style={{ color: COLOR_FINAIS }}>Anos Finais</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>
                    <input
                      type="number" min="2000" max="2099" placeholder="Ex: 2025" required
                      value={row.ano} onChange={(e) => updateRow(row._id, 'ano', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number" min="0" max="10" step="0.01" placeholder="0,00 – 10,00"
                      value={row.anos_iniciais} onChange={(e) => updateRow(row._id, 'anos_iniciais', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number" min="0" max="10" step="0.01" placeholder="0,00 – 10,00"
                      value={row.anos_finais} onChange={(e) => updateRow(row._id, 'anos_finais', e.target.value)}
                    />
                  </td>
                  <td>
                    <button type="button" className="icon-btn" onClick={() => removeRow(row._id)} tabIndex={-1}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ideb-form-bottom">
            <button type="button" className="ideb-add-row" onClick={addRow}>
              <Plus size={13} /> Adicionar ano
            </button>
            <div className="ideb-form-actions">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button type="button" className="btn btn-sm" onClick={closeAdding}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="skel skel-row" style={{ margin: '16px 0' }} />
      ) : entries.length > 0 ? (
        <>
          {entries.length >= 2 && (
            <div className="ideb-chart-wrapper">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 10, right: 24, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="ano" tick={{ fontSize: 12, fill: '#615d59' }} />
                  <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 12, fill: '#615d59' }} />
                  <ReferenceLine y={6} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Meta 6', fill: '#f59e0b', fontSize: 11 }} />
                  <Tooltip
                    formatter={(v, name) => [v != null ? Number(v).toFixed(2) : '–', name]}
                    labelFormatter={(l) => `Ano ${l}`}
                    contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid rgba(0,0,0,0.09)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Line type="monotone" dataKey="Anos Iniciais" stroke={COLOR_INICIAIS} strokeWidth={2.5}
                    dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: COLOR_INICIAIS }} activeDot={{ r: 7 }} connectNulls />
                  <Line type="monotone" dataKey="Anos Finais" stroke={COLOR_FINAIS} strokeWidth={2.5}
                    dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: COLOR_FINAIS }} activeDot={{ r: 7 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <table className="ideb-table">
            <thead>
              <tr>
                <th>Ano</th>
                <th style={{ color: COLOR_INICIAIS }}>Anos Iniciais</th>
                <th style={{ color: COLOR_FINAIS }}>Anos Finais</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.ano}</td>
                  <td>{fmt(entry.anos_iniciais)}</td>
                  <td>{fmt(entry.anos_finais)}</td>
                  <td>
                    <button type="button" className="icon-btn icon-btn-danger" title="Remover"
                      onClick={() => handleDelete(entry.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : !adding ? (
        <p className="ideb-empty">Nenhum dado registrado. Clique em + para adicionar.</p>
      ) : null}
    </section>
  );
}
