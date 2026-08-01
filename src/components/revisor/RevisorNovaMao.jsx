import { useEffect, useMemo, useState } from "react";
import { BookOpen, Tag, ImagePlus, X, Save, Play, Plus, Loader2 } from "lucide-react";
import { getCurrentUser } from "../../services/authService";
import {
  fetchTags,
  createUserTag,
  createReview,
  validateImage,
  registerReviewEvent,
} from "../../revisor/handReviewService";

const ACCENT = "#A855F7";
const MAX_IMAGES = 3;

export default function RevisorNovaMao({ onSaved, onSavedAndReview, onCancel }) {
  const [userId, setUserId] = useState(null);
  const [title, setTitle] = useState("");
  const [freeText, setFreeText] = useState("");
  const [handHistory, setHandHistory] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (user) setUserId(user.id);
      try {
        const t = await fetchTags();
        setTags(t);
      } catch (e) {
        setError("Erro ao carregar etiquetas.");
      }
    })();
  }, []);

  const canSave = useMemo(() => {
    return (
      freeText.trim() ||
      handHistory.trim() ||
      images.length > 0 ||
      selectedTagIds.length > 0
    );
  }, [freeText, handHistory, images, selectedTagIds]);

  function toggleTag(id) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleAddNewTag() {
    const clean = newTagLabel.trim();
    if (!clean || !userId) return;
    try {
      const created = await createUserTag(userId, clean);
      setTags((prev) => [...prev, created]);
      setSelectedTagIds((prev) => [...prev, created.id]);
      setNewTagLabel("");
    } catch (e) {
      setError(e.message || "Erro ao criar etiqueta.");
    }
  }

  function handleFiles(fileList) {
    const files = Array.from(fileList);
    const room = MAX_IMAGES - images.length;
    const next = [];
    for (const file of files.slice(0, room)) {
      const err = validateImage(file);
      if (err) {
        setError(err);
        continue;
      }
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setImages((prev) => [...prev, ...next]);
  }

  function removeImage(idx) {
    setImages((prev) => {
      const clone = [...prev];
      URL.revokeObjectURL(clone[idx].previewUrl);
      clone.splice(idx, 1);
      return clone;
    });
  }

  async function save(goToReview) {
    if (!userId || !canSave || saving) return;
    setSaving(true);
    setError("");
    try {
      const review = await createReview(userId, {
        title,
        freeText,
        handHistory,
        tagIds: selectedTagIds,
        images: images.map((i) => i.file),
      });

      const xp = await registerReviewEvent("registered", review.id);
      if (xp?.xp_final) console.log(`+${xp.xp_final} XP (Registro)`);

      if (goToReview) {
        onSavedAndReview?.(review.id);
      } else {
        onSaved?.();
      }
    } catch (e) {
      setError(e.message || "Erro ao salvar a mão.");
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 16 }}>Nova Mão</h2>

      <section style={S.section}>
        <label style={S.label}>Título (opcional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: 3B pot vs BTN — river tough"
          style={S.input}
        />
      </section>

      <section style={S.section}>
        <label style={S.label}>Descrição livre</label>
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Descreva o contexto, sizings, reads, dúvidas..."
          rows={4}
          style={S.textarea}
        />
        <label style={{ ...S.label, marginTop: 16 }}>Hand history (colar)</label>
        <textarea
          value={handHistory}
          onChange={(e) => setHandHistory(e.target.value)}
          placeholder="Cole aqui o histórico da mão"
          rows={6}
          style={{ ...S.textarea, fontFamily: "monospace", fontSize: 12 }}
        />
      </section>

      <section style={S.section}>
        <div style={S.rowBetween}>
          <label style={S.label}>
            <Tag size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Etiquetas
          </label>
          <span style={S.hint}>{selectedTagIds.length} selecionada(s)</span>
        </div>

        <div style={S.tagWrap}>
          {tags.map((t) => {
            const active = selectedTagIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                style={{
                  ...S.tagChip,
                  background: active ? ACCENT : "transparent",
                  borderColor: active ? ACCENT : "#333",
                  color: active ? "#000" : "#fff",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{ ...S.rowBetween, marginTop: 12, gap: 8 }}>
          <input
            value={newTagLabel}
            onChange={(e) => setNewTagLabel(e.target.value)}
            placeholder="Criar nova etiqueta"
            style={{ ...S.input, flex: 1 }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddNewTag())}
          />
          <button type="button" onClick={handleAddNewTag} style={S.btnGhost}>
            <Plus size={16} />
          </button>
        </div>
      </section>

      <section style={S.section}>
        <div style={S.rowBetween}>
          <label style={S.label}>Prints ({images.length}/{MAX_IMAGES})</label>
          <span style={S.hint}>JPG, PNG ou WEBP — até 5MB</span>
        </div>

        <div style={S.imgGrid}>
          {images.map((img, i) => (
            <div key={i} style={S.imgTile}>
              <img src={img.previewUrl} alt="" style={S.imgPreview} />
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={S.imgRemove}
                aria-label="Remover"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <label style={S.imgAdd}>
              <ImagePlus size={22} color={ACCENT} />
              <span style={{ fontSize: 12, marginTop: 6, color: "#999" }}>Adicionar</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          )}
        </div>
      </section>

      {error && <div style={S.error}>{error}</div>}

      <footer style={S.footer}>
        <button
          type="button"
          onClick={() => save(false)}
          disabled={!canSave || saving}
          style={{ ...S.btnSecondary, opacity: !canSave || saving ? 0.5 : 1 }}
        >
          {saving ? <Loader2 size={16} /> : <Save size={16} />}
          Salvar e revisar depois
        </button>
        <button
          type="button"
          onClick={() => save(true)}
          disabled={!canSave || saving}
          style={{ ...S.btnPrimary, opacity: !canSave || saving ? 0.5 : 1 }}
        >
          {saving ? <Loader2 size={16} /> : <Play size={16} />}
          Salvar e começar revisão
        </button>
      </footer>
    </div>
  );
}

const S = {
  section: {
    background: "#111", border: "1px solid #1e1e1e", borderRadius: 12,
    padding: 16, marginBottom: 14,
  },
  label: { display: "block", fontSize: 13, color: "#bbb", marginBottom: 8 },
  hint: { fontSize: 11, color: "#666" },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  input: {
    width: "100%", background: "#000", border: "1px solid #2a2a2a", color: "#fff",
    borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box",
  },
  textarea: {
    width: "100%", background: "#000", border: "1px solid #2a2a2a", color: "#fff",
    borderRadius: 8, padding: 12, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical",
  },
  tagWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  tagChip: {
    padding: "6px 10px", fontSize: 12, borderRadius: 999,
    border: "1px solid #333", background: "transparent", color: "#fff",
    cursor: "pointer", transition: "all .15s",
  },
  imgGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 4 },
  imgTile: { position: "relative", aspectRatio: "1 / 1", borderRadius: 10, overflow: "hidden", background: "#000" },
  imgPreview: { width: "100%", height: "100%", objectFit: "cover" },
  imgRemove: {
    position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.7)",
    border: "1px solid #333", borderRadius: 999, color: "#fff", padding: 4, cursor: "pointer", display: "flex",
  },
  imgAdd: {
    aspectRatio: "1 / 1", border: "1px dashed #333", borderRadius: 10,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    cursor: "pointer", background: "#0a0a0a",
  },
  footer: { display: "flex", gap: 10, marginTop: 20 },
  btnPrimary: {
    flex: 1, background: ACCENT, color: "#000", border: "none", borderRadius: 10,
    padding: "12px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnSecondary: {
    flex: 1, background: "transparent", color: "#fff", border: "1px solid #333", borderRadius: 10,
    padding: "12px 16px", fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnGhost: {
    background: "transparent", color: "#fff", border: "1px solid #333", borderRadius: 8,
    padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center",
  },
  error: {
    background: "#2a0f0f", border: "1px solid #7f1d1d", color: "#fca5a5",
    padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 10,
  },
};
