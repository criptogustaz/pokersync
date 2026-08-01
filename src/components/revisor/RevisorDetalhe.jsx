import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, Save, CheckCircle2, HelpCircle,
  Lightbulb, Target, Loader2, PlayCircle, Scale,
} from 'lucide-react';
import { theme } from '../../theme';
import { getCurrentUser } from '../../services/authService';
import {
  getReview, getThumbUrl, suggestGuidedQuestions,
  saveAnswers, updateReviewProgress,
  STREETS, RATINGS, fetchReasons, fetchStreetEvals, saveStreetEvals,
  registerReviewEvent,
} from '../../revisor/handReviewService';

const ACCENT = '#A855F7';

export default function RevisorDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [review, setReview] = useState(null);
  const [qas, setQas] = useState([]);
  const [learning, setLearning] = useState('');
  const [drill, setDrill] = useState('');
  const [imgUrls, setImgUrls] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [streetEvals, setStreetEvals] = useState(
    STREETS.map((s) => ({ street: s, self_rating: '', reason_code: '', notes: '' }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [xpFeedback, setXpFeedback] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setUserId(u?.id || null);
      await load();
    })();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const r = await getReview(id);
      setReview(r);
      setLearning(r.learning_note || '');
      setDrill(r.drill_suggestion || '');

      const existing = r.answers || [];
      const questions = existing.length
        ? existing.map((a) => ({ question: a.question, answer: a.answer || '' }))
        : suggestGuidedQuestions(r.tags).map((q) => ({ question: q, answer: '' }));
      setQas(questions);

      const [rs, existingEvals] = await Promise.all([fetchReasons(), fetchStreetEvals(id)]);
      setReasons(rs);
      if (existingEvals.length) {
        setStreetEvals(
          STREETS.map((s) => {
            const found = existingEvals.find((e) => e.street === s);
            return found
              ? { street: s, self_rating: found.self_rating, reason_code: found.reason_code || '', notes: found.notes || '' }
              : { street: s, self_rating: '', reason_code: '', notes: '' };
          })
        );
      }

      const urls = await Promise.all(r.images.map((im) => getThumbUrl(im.storage_path)));
      setImgUrls(urls);
    } catch (e) {
      setError('Erro ao carregar a mão.');
    } finally {
      setLoading(false);
    }
  }

  function updateAnswer(idx, val) {
    setQas((prev) => prev.map((q, i) => (i === idx ? { ...q, answer: val } : q)));
  }

  async function persist(nextStatus) {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      await saveAnswers(id, userId, qas);
      await saveStreetEvals(id, userId, streetEvals);

      const patch = {
        learning_note: learning.trim() || null,
        drill_suggestion: drill.trim() || null,
      };
      if (nextStatus) patch.status = nextStatus;
      const updated = await updateReviewProgress(id, patch);
      setReview((prev) => ({ ...prev, ...updated }));

      // === Eventos de XP ===
      const events = [];

      const allStreetsRated =
        streetEvals.length === 4 &&
        streetEvals.every((e) => e.self_rating && e.self_rating !== '');
      if (allStreetsRated) events.push('full_self_eval');

      const allAnswered =
        qas.length > 0 && qas.every((q) => (q.answer || '').trim().length > 0);
      if (allAnswered) events.push('all_questions_answered');

      if (nextStatus === 'concluida') events.push('concluded');

      let totalXp = 0;
      let missionsCompleted = [];
      for (const ev of events) {
        const xp = await registerReviewEvent(ev, id);
        if (xp?.xp_final) totalXp += xp.xp_final;
        if (xp?.missions_completed?.length) {
          missionsCompleted = missionsCompleted.concat(xp.missions_completed);
        }
      }

      if (totalXp > 0 || missionsCompleted.length > 0) {
        setXpFeedback({ xp: totalXp, missions: missionsCompleted });
        setTimeout(() => setXpFeedback(null), 4000);
      }

      if (nextStatus === 'concluida') {
        setTimeout(() => navigate('/revisor'), missionsCompleted.length ? 2000 : 500);
      }
    } catch (e) {
      setError(e.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  function goToTraining() {
    const q = encodeURIComponent(drill || '');
    navigate(`/treino?drill=${q}&from=review&reviewId=${id}`);
  }

  if (loading) return <div style={S.page}><p style={{ color: '#888' }}>Carregando…</p></div>;
  if (!review) return <div style={S.page}><p style={{ color: '#888' }}>Mão não encontrada.</p></div>;

  const answeredCount = qas.filter((q) => q.answer.trim()).length;
  const canConclude = learning.trim().length > 0;

  return (
    <div style={S.page}>
      <header style={S.header}>
        <button onClick={() => navigate('/revisor')} style={S.backBtn} aria-label="Voltar">
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} color={ACCENT} />
            <h1 style={S.title}>{review.title || 'Mão sem título'}</h1>
          </div>
          <div style={S.tagsRow}>
            {review.tags.map((t) => (
              <span key={t.id} style={S.tagMini}>{t.label}</span>
            ))}
          </div>
        </div>
      </header>

      {(review.free_text || review.hand_history) && (
        <section style={S.section}>
          <h2 style={S.sectionTitle}>Contexto</h2>
          {review.free_text && <p style={S.freeText}>{review.free_text}</p>}
          {review.hand_history && (
            <pre style={S.hhBox}>{review.hand_history}</pre>
          )}
        </section>
      )}

      {imgUrls.length > 0 && (
        <section style={S.section}>
          <h2 style={S.sectionTitle}>Prints</h2>
          <div style={S.imgGrid}>
            {imgUrls.map((u, i) => u && (
              <a key={i} href={u} target="_blank" rel="noreferrer" style={S.imgTile}>
                <img src={u} alt="" style={S.thumbImg} />
              </a>
            ))}
          </div>
        </section>
      )}

      <section style={S.section}>
        <div style={S.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={16} color={ACCENT} />
            <h2 style={S.sectionTitle}>Perguntas guiadas</h2>
          </div>
          <span style={S.hint}>{answeredCount}/{qas.length} respondidas</span>
        </div>
        <p style={S.helper}>Responda com calma. O foco é pensar, não acertar.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {qas.map((q, i) => (
            <div key={i}>
              <label style={S.qLabel}>{i + 1}. {q.question}</label>
              <textarea
                value={q.answer}
                onChange={(e) => updateAnswer(i, e.target.value)}
                rows={3}
                placeholder="Sua análise…"
                style={S.textarea}
              />
            </div>
          ))}
        </div>
      </section>

      <section style={S.section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Scale size={16} color={ACCENT} />
          <h2 style={S.sectionTitle}>Auto-avaliação por street</h2>
        </div>
        <p style={S.helper}>Como você joga a mão em cada street? Essa é a base para detectar seus leaks.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {streetEvals.map((ev, idx) => (
            <div key={ev.street} style={S.streetBlock}>
              <div style={S.streetHead}>
                <span style={S.streetLabel}>{ev.street}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {RATINGS.map((r) => {
                    const active = ev.self_rating === r.code;
                    return (
                      <button
                        key={r.code}
                        type="button"
                        onClick={() => setStreetEvals((prev) =>
                          prev.map((e, i) => i === idx ? { ...e, self_rating: r.code } : e))}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          borderRadius: 6,
                          border: `1px solid ${active ? r.color : '#2a2a2a'}`,
                          background: active ? r.color : 'transparent',
                          color: active ? '#000' : '#fff',
                          cursor: 'pointer',
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {ev.self_rating === 'errei' && (
                <select
                  value={ev.reason_code}
                  onChange={(e) => setStreetEvals((prev) =>
                    prev.map((x, i) => i === idx ? { ...x, reason_code: e.target.value } : x))}
                  style={S.select}
                >
                  <option value="">Motivo do erro…</option>
                  {reasons.map((r) => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={S.section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Lightbulb size={16} color={ACCENT} />
          <h2 style={S.sectionTitle}>Registro de aprendizado</h2>
        </div>
        <p style={S.helper}>Resuma em 1–2 frases o que ficou dessa mão.</p>
        <textarea
          value={learning}
          onChange={(e) => setLearning(e.target.value)}
          rows={3}
          placeholder="Ex.: Subestimei blockers do vilão no river em spot 3B pot OOP."
          style={S.textarea}
        />
      </section>

      <section style={S.section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Target size={16} color={ACCENT} />
          <h2 style={S.sectionTitle}>Sugestão de drill</h2>
        </div>
        <p style={S.helper}>O que treinar para não repetir o erro?</p>
        <textarea
          value={drill}
          onChange={(e) => setDrill(e.target.value)}
          rows={2}
          placeholder="Ex.: BB defense vs BTN open — 20–30bb."
          style={S.textarea}
        />
        {drill.trim() && (
          <button onClick={goToTraining} style={S.trainingBtn}>
            <PlayCircle size={16} />
            Praticar no Modo Treino
          </button>
        )}
      </section>

      {error && <div style={S.error}>{error}</div>}

      <footer style={S.footer}>
        <button
          onClick={() => persist('em_revisao')}
          disabled={saving}
          style={{ ...S.btnSecondary, opacity: saving ? 0.5 : 1 }}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
          Salvar rascunho
        </button>
        <button
          onClick={() => persist('concluida')}
          disabled={saving || !canConclude}
          style={{ ...S.btnPrimary, opacity: saving || !canConclude ? 0.5 : 1 }}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
          Concluir revisão
        </button>
      </footer>

      {xpFeedback && (
        <div style={S.toast}>
          <span style={{ fontSize: 16 }}>+{xpFeedback.xp} XP</span>
          {xpFeedback.missions.map((m, i) => (
            <span key={i} style={{ fontSize: 11, opacity: 0.9 }}>
              🎯 Missão completa: +{m.xp_reward} XP
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  page: { maxWidth: 720, margin: '0 auto', padding: 20, color: '#fff' },
  header: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  backBtn: {
    background: 'transparent', border: '1px solid #2a2a2a', color: '#fff',
    borderRadius: 8, padding: 8, cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 20, margin: 0, fontFamily: theme?.fonts?.heading || 'Space Grotesk, sans-serif' },
  tagsRow: { display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 },
  tagMini: {
    fontSize: 10, padding: '2px 6px', borderRadius: 4,
    background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', border: '1px solid rgba(168,85,247,0.3)',
  },
  section: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 12, padding: 16, marginBottom: 14 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontSize: 14, margin: 0, color: '#fff', fontWeight: 600 },
  helper: { fontSize: 12, color: '#888', margin: '4px 0 12px' },
  hint: { fontSize: 11, color: '#666' },
  freeText: { fontSize: 13, color: '#ccc', lineHeight: 1.5, margin: 0 },
  hhBox: {
    marginTop: 10, padding: 10, background: '#000', border: '1px solid #222', borderRadius: 8,
    fontSize: 11, color: '#aaa', overflow: 'auto', maxHeight: 240,
    fontFamily: 'monospace', whiteSpace: 'pre-wrap',
  },
  imgGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  imgTile: { aspectRatio: '1 / 1', borderRadius: 8, overflow: 'hidden', background: '#0a0a0a', display: 'block' },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },
  qLabel: { display: 'block', fontSize: 13, color: '#ddd', marginBottom: 6, fontWeight: 500 },
  textarea: {
    width: '100%', background: '#000', border: '1px solid #2a2a2a', color: '#fff',
    borderRadius: 8, padding: 10, fontSize: 13, outline: 'none',
    boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
  },
  streetBlock: { padding: 10, background: '#0a0a0a', borderRadius: 8, border: '1px solid #1e1e1e' },
  streetHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  streetLabel: { fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#ddd' },
  select: {
    width: '100%', background: '#000', border: '1px solid #2a2a2a', color: '#fff',
    borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none', boxSizing: 'border-box',
  },
  trainingBtn: {
    marginTop: 10, background: 'transparent', border: `1px solid ${ACCENT}`,
    color: ACCENT, borderRadius: 8, padding: '8px 12px', fontSize: 12,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  footer: { display: 'flex', gap: 10, marginTop: 20 },
  btnPrimary: {
    flex: 1, background: ACCENT, color: '#000', border: 'none',
    borderRadius: 10, padding: '12px 16px', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnSecondary: {
    flex: 1, background: 'transparent', color: '#fff', border: '1px solid #333',
    borderRadius: 10, padding: '12px 16px', fontSize: 14,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  error: {
    background: '#2a0f0f', border: '1px solid #7f1d1d', color: '#fca5a5',
    padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 10,
  },
  toast: {
    position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, #A855F7, #7c3aed)', color: '#fff',
    padding: '12px 20px', borderRadius: 12, boxShadow: '0 8px 24px rgba(168,85,247,0.4)',
    fontSize: 14, fontWeight: 600,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 1000,
  },
};
