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

const emptyForm = () => ({ ano: new Date().getFullYear(), anos_iniciais: '', anos_finais: '' });

export default function IdebChart({ leadId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getIdebHistorico(leadId)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [leadId]);

  function field(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = await upsertIdebEntry(leadId, {
        ano:           parseInt(form.ano, 10),
        anos_iniciais: form.anos_iniciais !== '' ? parseFloat(form.anos_iniciais) : null,
        anos_finais:   form.anos_finais   !== '' ? parseFloat(form.anos_finais)   : null,
      });
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.ano === saved.ano);
        const next = idx >= 0
          ? prev.map((e, i) => i === idx ? saved : e)
          : [...prev, saved];
        return next.sort((a, b) => a.ano - b.ano);
      });
      setAdding(false);
      setForm(emptyForm);
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

  function editEntry(entry) {
    setForm({
      ano:           entry.ano,
      anos_iniciais: entry.anos_iniciais ?? '',
      anos_finais:   entry.anos_finais   ?? '',
    });
    setAdding(true);
  }

  const chartData = entries.map((e) => ({
    ano:            String(e.ano),
    'Anos Iniciais': e.anos_iniciais != null ? Number(e.anos_iniciais) : null,
    'Anos Finais':   e.anos_finais   != null ? Number(e.anos_finais)   : null,
  }));

  const hasChart = entries.length >= 1;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span>Indicadores</span>
          <h2>Evolução do IDEB</h2>
        </div>
        <button
          type="button"
          className="icon-btn"
          title={adding ? 'Cancelar' : 'Adicionar ano'}
          onClick={() => { setAdding((v) => !v); setForm(emptyForm()); setError(null); }}
        >
          <Plus size={14} />
        </button>
      </div>

      {error && <p className="ideb-error">{error}</p>}

      {adding && (
        <form onSubmit={handleSave} className="ideb-add-form">
          <div className="ideb-form-row">
            <label>
              Ano
              <input
                type="number" min="2000" max="2099" required
                value={form.ano} onChange={field('ano')}
              />
            </label>
            <label>
              <span style={{ color: COLOR_INICIAIS }}>Anos Iniciais</span>
              <input
                type="number" min="0" max="10" step="0.01" placeholder="0,00 – 10,00"
                value={form.anos_iniciais} onChange={field('anos_iniciais')}
              />
            </label>
            <label>
              <span style={{ color: COLOR_FINAIS }}>Anos Finais</span>
              <input
                type="number" min="0" max="10" step="0.01" placeholder="0,00 – 10,00"
                value={form.anos_finais} onChange={field('anos_finais')}
              />
            </label>
          </div>
          <div className="ideb-form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              type="button" className="btn btn-sm"
              onClick={() => { setAdding(false); setForm(emptyForm()); }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="skel skel-row" style={{ margin: '16px 0' }} />
      ) : hasChart ? (
        <>
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
                <Line
                  type="monotone" dataKey="Anos Iniciais"
                  stroke={COLOR_INICIAIS} strokeWidth={2.5}
                  dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: COLOR_INICIAIS }}
                  activeDot={{ r: 7 }}
                  connectNulls
                />
                <Line
                  type="monotone" dataKey="Anos Finais"
                  stroke={COLOR_FINAIS} strokeWidth={2.5}
                  dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: COLOR_FINAIS }}
                  activeDot={{ r: 7 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

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
                <tr key={entry.id} onClick={() => editEntry(entry)} className="ideb-table-row">
                  <td>{entry.ano}</td>
                  <td>{fmt(entry.anos_iniciais)}</td>
                  <td>{fmt(entry.anos_finais)}</td>
                  <td>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      title="Remover"
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : !adding ? (
        <p className="ideb-empty">Nenhum dado registrado. Clique em + para adicionar o primeiro ano.</p>
      ) : null}
    </section>
  );
}
