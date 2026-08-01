import { supabase } from '../services/supabaseClient';

const BUCKET = 'hand-reviews';
const MAX_IMAGES = 3;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export const STREETS = ['preflop', 'flop', 'turn', 'river'];

export const RATINGS = [
  { code: 'acertei',       label: 'Acertei', color: '#10b981' },
  { code: 'errei',         label: 'Errei',   color: '#ef4444' },
  { code: 'duvida',        label: 'Dúvida',  color: '#f59e0b' },
  { code: 'nao_se_aplica', label: 'N/A',     color: '#666'    },
];

// ============================================================
// Validações
// ============================================================
export function validateImage(file) {
  if (!ALLOWED.includes(file.type)) return 'Formato inválido (use JPG, PNG ou WEBP).';
  if (file.size > MAX_SIZE) return 'Arquivo excede 5MB.';
  return null;
}

// ============================================================
// Tags
// ============================================================
export async function fetchTags() {
  const { data, error } = await supabase
    .from('hand_review_tags')
    .select('id, label, is_system, user_id')
    .order('is_system', { ascending: false })
    .order('label', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createUserTag(userId, label) {
  const clean = label.trim();
  if (!clean) throw new Error('Etiqueta vazia.');
  const { data, error } = await supabase
    .from('hand_review_tags')
    .insert({ user_id: userId, label: clean, is_system: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// Reviews CRUD
// ============================================================
export async function createReview(userId, payload) {
  const { title, freeText, handHistory, tagIds, images } = payload;

  const { data: review, error: e1 } = await supabase
    .from('hand_reviews')
    .insert({
      user_id: userId,
      title: title?.trim() || null,
      free_text: freeText?.trim() || null,
      hand_history: handHistory?.trim() || null,
      status: 'pendente',
    })
    .select()
    .single();
  if (e1) throw e1;

  if (tagIds?.length) {
    const links = tagIds.map((tag_id) => ({ review_id: review.id, tag_id, user_id: userId }));
    const { error: e2 } = await supabase.from('hand_review_tag_links').insert(links);
    if (e2) throw e2;
  }

  if (images?.length) {
    const limited = images.slice(0, MAX_IMAGES);
    for (let i = 0; i < limited.length; i++) {
      const file = limited[i];
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `${userId}/${review.id}/${i + 1}.${ext}`;
      const { error: eUp } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });
      if (eUp) throw eUp;

      const { error: eImg } = await supabase.from('hand_review_images').insert({
        review_id: review.id,
        user_id: userId,
        storage_path: path,
        position: i + 1,
      });
      if (eImg) throw eImg;
    }
  }

  return review;
}

export async function listReviews(userId, { status } = {}) {
  let q = supabase
    .from('hand_reviews')
    .select(`
      id, title, free_text, status, created_at, updated_at, concluded_at,
      hand_review_tag_links ( tag_id, hand_review_tags ( id, label ) ),
      hand_review_images ( id, storage_path, position )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    tags: (r.hand_review_tag_links ?? []).map((l) => l.hand_review_tags).filter(Boolean),
    thumb: r.hand_review_images?.[0]?.storage_path || null,
  }));
}

export async function getThumbUrl(storagePath) {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);
  if (error) return null;
  return data?.signedUrl || null;
}

export async function deleteReview(reviewId) {
  const { error } = await supabase.from('hand_reviews').delete().eq('id', reviewId);
  if (error) throw error;
}

export async function getReview(reviewId) {
  const { data, error } = await supabase
    .from('hand_reviews')
    .select(`
      id, user_id, title, free_text, hand_history, status,
      learning_note, drill_suggestion, created_at, updated_at, concluded_at,
      hand_review_tag_links ( tag_id, hand_review_tags ( id, label ) ),
      hand_review_images ( id, storage_path, position ),
      hand_review_answers ( id, position, question, answer )
    `)
    .eq('id', reviewId)
    .single();
  if (error) throw error;
  return {
    ...data,
    tags: (data.hand_review_tag_links ?? []).map((l) => l.hand_review_tags).filter(Boolean),
    images: (data.hand_review_images ?? []).sort((a, b) => a.position - b.position),
    answers: (data.hand_review_answers ?? []).sort((a, b) => a.position - b.position),
  };
}

// ============================================================
// Perguntas guiadas
// ============================================================
export function suggestGuidedQuestions(tags) {
  const labels = tags.map((t) => t.label.toLowerCase());
  const base = [
    'Qual era o seu plano antes da ação do vilão?',
    'Qual parte do range do vilão você estava atacando/defendendo?',
    'Que informação você usou para tomar a decisão (sizings, timing, dinâmica)?',
  ];
  const extras = [];
  if (labels.some((l) => l.includes('icm') || l.includes('bubble') || l.includes('final table')))
    extras.push('Como o fator ICM afetou o range de call/shove nesse spot?');
  if (labels.some((l) => l.includes('3-bet') || l.includes('4-bet')))
    extras.push('O range de 3B/4B do vilão inclui blefes suficientes para justificar sua ação?');
  if (labels.some((l) => l.includes('pko')))
    extras.push('Qual o valor da recompensa (bounty) na decisão de risco?');
  if (labels.some((l) => l.includes('hero call') || l.includes('bluffcatch')))
    extras.push('Que blockers você tem contra o range de value do vilão?');
  if (labels.some((l) => l.includes('cbet') || l.includes('turn barrel')))
    extras.push('A textura da board favorece mais o range do agressor ou do caller?');
  return [...base, ...extras].slice(0, 5);
}

export async function saveAnswers(reviewId, userId, qas) {
  const { error: eDel } = await supabase
    .from('hand_review_answers')
    .delete()
    .eq('review_id', reviewId);
  if (eDel) throw eDel;

  if (qas.length === 0) return;
  const rows = qas.map((q, i) => ({
    review_id: reviewId,
    user_id: userId,
    position: i + 1,
    question: q.question,
    answer: q.answer || null,
  }));
  const { error } = await supabase.from('hand_review_answers').insert(rows);
  if (error) throw error;
}

export async function updateReviewProgress(reviewId, patch) {
  const { data, error } = await supabase
    .from('hand_reviews')
    .update(patch)
    .eq('id', reviewId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// Auto-avaliação por street
// ============================================================
export async function fetchReasons() {
  const { data, error } = await supabase
    .from('hand_eval_reasons')
    .select('code, label, category')
    .eq('active', true)
    .order('category')
    .order('label');
  if (error) throw error;
  return data ?? [];
}

export async function fetchStreetEvals(reviewId) {
  const { data, error } = await supabase
    .from('hand_review_street_evals')
    .select('street, self_rating, reason_code, notes')
    .eq('review_id', reviewId);
  if (error) throw error;
  return data ?? [];
}

export async function saveStreetEvals(reviewId, userId, evals) {
  const { error: eDel } = await supabase
    .from('hand_review_street_evals')
    .delete()
    .eq('review_id', reviewId);
  if (eDel) throw eDel;

  const rows = evals
    .filter((e) => e.self_rating)
    .map((e) => ({
      review_id: reviewId,
      user_id: userId,
      street: e.street,
      self_rating: e.self_rating,
      reason_code: e.self_rating === 'errei' ? e.reason_code || null : null,
      notes: e.notes || null,
    }));
  if (!rows.length) return;
  const { error } = await supabase.from('hand_review_street_evals').insert(rows);
  if (error) throw error;
}

// ============================================================
// Leaks e sugestões de drill
// ============================================================
export async function fetchUserLeaksWithDrills(days = 30, minOccurrences = 3) {
  const { data, error } = await supabase.rpc('suggest_drills_for_user', {
    p_days: days,
    p_min_occurrences: minOccurrences,
    p_per_leak: 1,
  });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReviewSummary(days = 30) {
  const { data, error } = await supabase.rpc('user_review_summary', { p_days: days });
  if (error) throw error;
  return data?.[0] ?? null;
}

// ============================================================
// Eventos de XP / gamificação
// ============================================================
export async function registerReviewEvent(eventType, reviewId) {
  const { data, error } = await supabase.rpc('register_review_event', {
    p_event_type: eventType,
    p_review_id: reviewId,
  });
  if (error) {
    console.warn('[XP] Falha ao registrar evento:', error.message);
    return null;
  }
  return data?.[0] ?? null;
}
