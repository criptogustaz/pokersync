import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Clock, CheckCircle2, PlayCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import { theme } from '../../theme';
import { getCurrentUser } from '../../services/authService';
import { listReviews, getThumbUrl, deleteReview } from '../../revisor/handReviewService';
import LeaksCard from './LeaksCard';

const ACCENT = '#A855F7';

const FILTERS = [
  { id: 'todas', label: 'Todas', status: null },
  { id: 'pendente', label: 'Pendentes', status: 'pendente' },
  { id: 'em_revisao', label: 'Em revisão', status: 'em_revisao' },
  { id: 'concluida', label: 'Concluídas', status: 'concluida' },
];

const STATUS_META = {
  pendente:   { label: 'Pendente',   color: '#f59e0b', Icon: Clock },
  em_revisao: { label: 'Em revisão', color: '#3b82f6', Icon: PlayCircle },
  concluida:  { label: 'Concluída',  color: '#10b981', Icon: CheckCircle2 },
};

export default function RevisorFila() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState('todas');
  const [items, setItems] = useState([]);
  const [thumbs, setThumbs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setUserId(user.id);
    })();
  }, []);

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId, filter]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const status = FILTERS.find((f) => f.id === filter)?.status;
      const rows = await listReviews(userId, { status: status || undefined });
      setItems(rows);
      const urls = {};
      await Promise.all(
        rows.map(async (r) => {
          if (r.thumb) urls[r.id] = await getThumbUrl(r.thumb);
        })
      );
      setThumbs(urls);
    } catch (e) {
      setError('Erro ao carregar mãos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta mão? Ação não pode ser desfeita.')) return;
    try {
      await deleteReview(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Erro ao excluir.');
    }
  }

  const counts = useMemo(() => {
    const acc = { pendente: 0, em_revisao: 0, concluida: 0 };
    items.forEach((r) => { if (acc[r.status] !== undefined) acc[r.status]++; });
    return acc;
  }, [items]);

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={22} color={ACCENT} />
          <h1 style={S.title}>Revisor de Mãos</h1>
        </div>
        <button style={S.btnPrimary} onClick={() => navigate('/revisor/nova')}>
          <Plus size={16} />
          Nova mão
        </button>
      </header>

      <div style={S.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                ...S.filterChip,
                background: active ? ACCENT : 'transparent',
                borderColor: active ? ACCENT : '#2a2a2a',
                color: active ? '#000' : '#fff',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error && <div style={S.error}>{error}</div>}

      <LeaksCard />

      {loading ? (
        <div style={S.empty}>Carregando…</div>
      ) : items.length === 0 ? (
        <div style={S.empty}>
          <BookOpen size={32} color="#333" />
          <p style={{ marginTop: 12, color: '#888' }}>Nenhuma mão aqui ainda.</p>
          <button style={{ ...S.btnPrimary, marginTop: 8 }} onClick={() => navigate('/revisor/nova')}>
            <Plus size={16} />
            Registrar primeira mão
          </button>
        </div>
      ) : (
        <ul style={S.list}>
          {items.map((r) => {
            const meta = STATUS_META[r.status] || STATUS_META.pendente;
            const StatusIcon = meta.Icon;
            return (
              <li key={r.id} style={S.card} onClick={() => navigate(`/revisor/${r.id}`)}>
                <div style={S.cardThumb}>
                  {thumbs[r.id] ? (
                    <img src={thumbs[r.id]} alt="" style={S.thumbImg} />
                  ) : (
                    <ImageIcon size={22} color="#333" />
                  )}
                </div>

                <div style={S.cardBody}>
                  <div style={S.cardTitleRow}>
                    <span style={S.cardTitle}>
                      {r.title || 'Mão sem título'}
                    </span>
                    <span style={{ ...S.statusPill, color: meta.color, borderColor: meta.color }}>
                      <StatusIcon size={12} />
                      {meta.label}
                    </span>
                  </div>

                  {r.free_text && (
                    <p style={S.cardExcerpt}>
                      {r.free_text.length > 90 ? r.free_text.slice(0, 90) + '…' : r.free_text}
                    </p>
                  )}

                  {r.tags.length > 0 && (
                    <div style={S.tagsRow}>
                      {r.tags.slice(0, 4).map((t) => (
                        <span key={t.id} style={S.tagMini}>{t.label}</span>
                      ))}
                      {r.tags.length > 4 && <span style={S.tagMini}>+{r.tags.length - 4}</span>}
                    </div>
                  )}

                  <div style={S.cardFoot}>
                    <span style={S.dateTxt}>{formatDate(r.created_at)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                      style={S.deleteBtn}
                      aria-label="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && (
        <div style={S.summary}>
          <span>Pendentes: <b style={{ color: '#f59e0b' }}>{counts.pendente}</b></span>
          <span>Em revisão: <b style={{ color: '#3b82f6' }}>{counts.em_revisao}</b></span>
          <span>Concluídas: <b style={{ color: '#10b981' }}>{counts.concluida}</b></span>
        </div>
      )}
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const S = {
  page: { maxWidth: 720, margin: '0 auto', padding: 20, color: '#fff' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 22, margin: 0, fontFamily: theme?.fonts?.heading || 'Space Grotesk, sans-serif' },
  filters: { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  filterChip: {
    padding: '6px 12px', fontSize: 12, borderRadius: 999,
    border: '1px solid #2a2a2a', background: 'transparent', color: '#fff',
    cursor: 'pointer', transition: 'all .15s',
  },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    display: 'flex', gap: 12, background: '#111', border: '1px solid #1e1e1e',
    borderRadius: 12, padding: 12, cursor: 'pointer', transition: 'border-color .15s',
  },
  cardThumb: {
    width: 72, height: 72, borderRadius: 10, background: '#0a0a0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statusPill: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid', background: 'transparent', flexShrink: 0,
  },
  cardExcerpt: { fontSize: 12, color: '#999', margin: '6px 0 0', lineHeight: 1.4 },
  tagsRow: { display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  tagMini: {
    fontSize: 10, padding: '2px 6px', borderRadius: 4,
    background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', border: '1px solid rgba(168,85,247,0.3)',
  },
  cardFoot: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  dateTxt: { fontSize: 11, color: '#666' },
  deleteBtn: { background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: 4 },
  btnPrimary: {
    background: ACCENT, color: '#000', border: 'none', borderRadius: 8,
    padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 40, background: '#0a0a0a', border: '1px dashed #222', borderRadius: 12, textAlign: 'center',
  },
  error: { background: '#2a0f0f', border: '1px solid #7f1d1d', color: '#fca5a5', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 10 },
  summary: {
    display: 'flex', justifyContent: 'space-around', marginTop: 20, padding: 12,
    background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, fontSize: 12, color: '#999',
  },
};
