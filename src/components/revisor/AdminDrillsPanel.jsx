import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, Loader2, X, Target } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { fetchReasons } from '../../revisor/handReviewService';

const ACCENT = '#A855F7';
const CATEGORIES = ['sizing','range','icm','blocker','timing','mental','value','bluff','pot_control','position','fold_equity','other'];
const STREETS = ['preflop','flop','turn','river'];

const EMPTY = {
  reason_code: '', category: '', street: '', tag_label: '',
  drill_title: '', drill_description: '',
  filter_config_text: '{}', priority: 50, active: true,
};

export default function AdminDrillsPanel() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [r, list] = await Promise.all([fetchReasons(), loadDrills()]);
      setReasons(r);
      setItems(list);
      setLoading(false);
    })();
  }, []);

  async function loadDrills() {
    const { data, error: e } = await supabase
      .from('hand_review_drill_suggestions')
      .select('*')
      .order('priority', { ascending: false });
    if (e) { setError('Erro ao carregar.'); return []; }
    return data ?? [];
  }

  function openNew() { setEditing({ ...EMPTY }); }
  function openEdit(item) {
    setEditing({
      ...item,
      reason_code: item.reason_code || '',
      category: item.category || '',
      street: item.street || '',
      tag_label: item.tag_label || '',
      drill_description: item.drill_description || '',
      filter_config_text: JSON.stringify(item.filter_config || {}, null, 2),
    });
  }
  function close() { setEditing(null); setError(''); }

  async function save() {
    if (!editing.drill_title.trim()) return setError('Título obrigatório.');
    if (!editing.reason_code && !editing.category && !editing.tag_label)
      return setError('Preencha ao menos: reason_code, category ou tag_label.');

    let filter_config;
    try { filter_config = JSON.parse(editing.filter_config_text || '{}'); }
    catch { return setError('filter_config inválido (JSON).'); }

    setSaving(true); setError('');
    const payload = {
      reason_code: editing.reason_code || null,
      category: editing.category || null,
      street: editing.street || null,
      tag_label: editing.tag_label || null,
      drill_title: editing.drill_title.trim(),
      drill_description: editing.drill_description?.trim() || null,
      filter_config,
      priority: Number(editing.priority) || 0,
      active: !!editing.active,
    };

    const q = editing.id
      ? supabase.from('hand_review_drill_suggestions').update(payload).eq('id', editing.id)
      : supabase.from('hand_review_drill_suggestions').insert(payload);

    const { error: e } = await q;
    if (e) { setError(e.message); setSaving(false); return; }

    const list = await loadDrills();
    setItems(list); setSaving(false); close();
  }

  async function remove(id) {
    if (!confirm('Excluir esta sugestão?')) return;
    await supabase.from('hand_review_drill_suggestions').delete().eq('id', id);
    setItems(await loadDrills());
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <button onClick={() => navigate(-1)} style={S.backBtn}><ArrowLeft size={16} /></button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={18} color={ACCENT} />
          <h1 style={S.title}>Drills Sugeridos</h1>
        </div>
        <button style={S.btnPrimary} onClick={openNew}><Plus size={14} /> Novo</button>
      </header>

      {loading ? (
        <p style={{ color: '#888' }}>Carregando…</p>
      ) : (
        <ul style={S.list}>
          {items.map((d) => (
            <li key={d.id} style={{ ...S.card, opacity: d.active ? 1 : 0.5 }} onClick={() => openEdit(d)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.rowTitle}>
                  <b style={{ fontSize: 13 }}>{d.drill_title}</b>
                  <span style={S.pill}>prio {d.priority}</span>
                </div>
                <div style={S.tags}>
                  {d.reason_code && <span style={S.chip}>{d.reason_code}</span>}
                  {d.category    && <span style={S.chip}>{d.category}</span>}
                  {d.street      && <span style={S.chip}>{d.street}</span>}
                  {d.tag_label   && <span style={S.chip}>{d.tag_label}</span>}
                </div>
              </div>
              <button style={S.deleteBtn} onClick={(e) => { e.stopPropagation(); remove(d.id); }}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div style={S.modalBg} onClick={close}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalHead}>
              <b>{editing.id ? 'Editar' : 'Novo'} drill</b>
              <button onClick={close} style={S.iconBtn}><X size={16} /></button>
            </div>

            <label style={S.lbl}>Título*</label>
            <input value={editing.drill_title}
              onChange={(e) => setEditing({ ...editing, drill_title: e.target.value })} style={S.inp} />

            <label style={S.lbl}>Descrição</label>
            <textarea value={editing.drill_description} rows={2}
              onChange={(e) => setEditing({ ...editing, drill_description: e.target.value })} style={S.txt} />

            <div style={S.grid2}>
              <div>
                <label style={S.lbl}>Reason code</label>
                <select value={editing.reason_code}
                  onChange={(e) => setEditing({ ...editing, reason_code: e.target.value })} style={S.inp}>
                  <option value="">—</option>
                  {reasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Categoria</label>
                <select value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })} style={S.inp}>
                  <option value="">—</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={S.grid2}>
              <div>
                <label style={S.lbl}>Street</label>
                <select value={editing.street}
                  onChange={(e) => setEditing({ ...editing, street: e.target.value })} style={S.inp}>
                  <option value="">—</option>
                  {STREETS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Tag label</label>
                <input value={editing.tag_label}
                  onChange={(e) => setEditing({ ...editing, tag_label: e.target.value })}
                  placeholder="Ex: 3-Bet Pot" style={S.inp} />
              </div>
            </div>

            <label style={S.lbl}>filter_config (JSON)</label>
            <textarea value={editing.filter_config_text} rows={4}
              onChange={(e) => setEditing({ ...editing, filter_config_text: e.target.value })}
              style={{ ...S.txt, fontFamily: 'monospace', fontSize: 11 }} />

            <div style={S.grid2}>
              <div>
                <label style={S.lbl}>Prioridade</label>
                <input type="number" value={editing.priority}
                  onChange={(e) => setEditing({ ...editing, priority: e.target.value })} style={S.inp} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ccc' }}>
                  <input type="checkbox" checked={editing.active}
                    onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                  Ativo
                </label>
              </div>
            </div>

            {error && <div style={S.err}>{error}</div>}

            <button onClick={save} disabled={saving}
              style={{ ...S.btnPrimary, width: '100%', marginTop: 12, opacity: saving ? 0.5 : 1 }}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  page: { maxWidth: 720, margin: '0 auto', padding: 20, color: '#fff' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  title: { fontSize: 20, margin: 0 },
  backBtn: { background: 'transparent', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8, padding: 6, cursor: 'pointer' },
  btnPrimary: { background: ACCENT, color: '#000', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  card: { display: 'flex', gap: 10, background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: 12, cursor: 'pointer' },
  rowTitle: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pill: { fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#222', color: '#888' },
  tags: { display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  chip: { fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', border: '1px solid rgba(168,85,247,0.3)' },
  deleteBtn: { background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' },
  modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 },
  modal: { background: '#0a0a0a', border: '1px solid #222', borderRadius: 12, padding: 20, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' },
  modalHead: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 },
  iconBtn: { background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' },
  lbl: { display: 'block', fontSize: 11, color: '#999', marginTop: 10, marginBottom: 4, textTransform: 'uppercase' },
  inp: { width: '100%', background: '#000', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 6, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  txt: { width: '100%', background: '#000', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 6, padding: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  err: { background: '#2a0f0f', border: '1px solid #7f1d1d', color: '#fca5a5', padding: 8, borderRadius: 6, fontSize: 12, marginTop: 10 },
};
