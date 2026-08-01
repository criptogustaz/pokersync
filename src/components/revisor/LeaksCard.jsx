import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, PlayCircle, ChevronRight } from 'lucide-react';
import { fetchUserLeaksWithDrills } from '../../revisor/handReviewService';

const ACCENT = '#A855F7';
const WARN = '#f59e0b';

export default function LeaksCard() {
  const navigate = useNavigate();
  const [leaks, setLeaks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUserLeaksWithDrills(30, 3);
        setLeaks(data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading || leaks.length === 0) return null;

  function goToTraining(leak) {
    const params = new URLSearchParams({
      drill: leak.drill_title || '',
      from: 'leak',
      drillId: leak.drill_id || '',
      config: JSON.stringify(leak.filter_config || {}),
    });
    navigate(`/treino?${params.toString()}`);
  }

  return (
    <div style={S.card}>
      <div style={S.header}>
        <AlertTriangle size={16} color={WARN} />
        <h3 style={S.title}>Leaks recorrentes (30 dias)</h3>
      </div>

      <ul style={S.list}>
        {leaks.slice(0, 3).map((l, i) => (
          <li key={i} style={S.item}>
            <div style={S.itemInfo}>
              <span style={S.itemReason}>{l.reason_label}</span>
              <span style={S.itemMeta}>
                {l.street.toUpperCase()} · {l.occurrences}x
              </span>
              {l.drill_title && (
                <span style={S.itemDrill}>→ {l.drill_title}</span>
              )}
            </div>
            {l.drill_id && (
              <button onClick={() => goToTraining(l)} style={S.itemBtn} aria-label="Praticar">
                <PlayCircle size={18} color={ACCENT} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {leaks.length > 3 && (
        <button style={S.moreBtn} onClick={() => navigate('/hub')}>
          Ver todos <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

const S = {
  card: {
    background: 'linear-gradient(180deg, rgba(245,158,11,0.08), rgba(168,85,247,0.06))',
    border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  header: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 13, margin: 0, fontWeight: 600, color: '#fff' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  item: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 8,
  },
  itemInfo: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 },
  itemReason: { fontSize: 13, color: '#fff', fontWeight: 500 },
  itemMeta: { fontSize: 10, color: '#888' },
  itemDrill: { fontSize: 11, color: '#c4b5fd', marginTop: 2 },
  itemBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: 6, display: 'flex', flexShrink: 0,
  },
  moreBtn: {
    background: 'transparent', border: 'none', color: '#c4b5fd',
    fontSize: 12, padding: '6px 0', marginTop: 6, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  },
};
