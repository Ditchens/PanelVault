import React, { useMemo, useState } from "react";
import { COMICS_TAG_OPTIONS, ANIME_TAG_OPTIONS } from "../lib/constants";
import { formatTypeLabel } from "../lib/seriesUtils";

// Recommends series from the user's own library (notRead / readNext) that share
// tags with what they're currently reading or have finished.
export default function RecommendationsModal({ series, onOpenSeries, onClose }) {
  const [activeCategory, setActiveCategory] = useState("comics");

  const { recs, topTags } = useMemo(() => {
    const cat = series.filter((s) => (s.mediaCategory || "comics") === activeCategory);
    const tagOpts = activeCategory === "anime" ? ANIME_TAG_OPTIONS : COMICS_TAG_OPTIONS;

    // Source: reading + finished items with tags
    const source = cat.filter((s) => (s.status === "reading" || s.status === "finished") && s.tags.length > 0);

    // Tally tag frequency from source
    const tagFreq = {};
    for (const item of source) {
      for (const tag of item.tags) {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      }
    }

    // Top 5 tags
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Candidates: notRead or readNext in this category with matching tags
    const candidates = cat.filter((s) => s.status === "notRead" || s.status === "readNext");

    // Score each candidate by how many top tags it shares
    const scored = candidates
      .map((item) => {
        const score = item.tags.filter((t) => topTags.includes(t)).length;
        return { item, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || (b.item.rating || 0) - (a.item.rating || 0));

    // If not enough library recs, pad with untagged notRead items
    const recItems = scored.map((r) => r.item);
    if (recItems.length < 6) {
      const extras = candidates
        .filter((c) => !recItems.find((r) => r.id === c.id))
        .slice(0, 6 - recItems.length);
      recItems.push(...extras);
    }

    return { recs: recItems.slice(0, 12), topTags };
  }, [series, activeCategory]);

  const hasSource = series.some(
    (s) => (s.mediaCategory || "comics") === activeCategory &&
      (s.status === "reading" || s.status === "finished") &&
      s.tags.length > 0
  );

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.heading}>For You</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Category toggle */}
        <div style={s.catRow}>
          {["comics", "anime"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{ ...s.catBtn, ...(activeCategory === cat ? s.catBtnActive : {}) }}
            >
              {cat === "anime" ? "Anime" : "Comics"}
            </button>
          ))}
        </div>

        {/* Top tags */}
        {topTags.length > 0 && (
          <div>
            <p style={s.sectionLabel}>Based on your taste for</p>
            <div style={s.tagRow}>
              {topTags.map((tag) => (
                <span key={tag} style={s.tag}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {!hasSource && (
          <div style={s.empty}>
            <p style={s.emptyTitle}>Not enough data yet</p>
            <p style={s.emptyText}>
              Start reading and tagging series so we can suggest what to pick up next.
            </p>
          </div>
        )}

        {hasSource && recs.length === 0 && (
          <div style={s.empty}>
            <p style={s.emptyTitle}>You're all caught up</p>
            <p style={s.emptyText}>No unread titles in your library match your current taste. Try Discover to find more.</p>
          </div>
        )}

        {recs.length > 0 && (
          <div style={s.grid}>
            {recs.map((item) => (
              <button key={item.id} onClick={() => { onOpenSeries(item); onClose(); }} style={s.card}>
                <div style={s.coverWrap}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} style={s.cover}
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  ) : (
                    <div style={s.noCover}>{(item.title || "?")[0].toUpperCase()}</div>
                  )}
                  {item.rating && <div style={s.ratingBadge}>★ {item.rating}</div>}
                  <div style={s.typeBadge}>{formatTypeLabel(item.type)}</div>
                </div>
                <p style={s.cardTitle}>{item.title}</p>
                {item.tags.length > 0 && (
                  <p style={s.cardTags}>{item.tags.slice(0, 2).join(" · ")}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, zIndex: 1000,
  },
  modal: {
    width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto",
    background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    display: "flex", flexDirection: "column", gap: 18,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  heading: { margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" },
  closeBtn: {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "#94a3b8", cursor: "pointer", fontSize: "1rem",
    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
  },
  catRow: {
    display: "flex", borderRadius: 12, overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)", alignSelf: "flex-start",
  },
  catBtn: {
    padding: "9px 18px", background: "rgba(255,255,255,0.05)",
    color: "#94a3b8", border: "none", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
  },
  catBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", color: "#fff",
  },
  sectionLabel: {
    margin: "0 0 8px", fontSize: "0.78rem", fontWeight: 800,
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em",
  },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 7 },
  tag: {
    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 999, padding: "5px 12px", fontSize: "0.82rem", fontWeight: 700, color: "#a5b4fc",
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 14,
  },
  card: {
    background: "transparent", border: "none", padding: 0,
    cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 7,
  },
  coverWrap: {
    width: "100%", aspectRatio: "0.72 / 1", borderRadius: 14,
    overflow: "hidden", background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)", position: "relative",
  },
  cover: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noCover: {
    width: "100%", height: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "1.8rem", fontWeight: 900,
    color: "#475569", background: "linear-gradient(135deg, #1e293b, #0f172a)",
  },
  ratingBadge: {
    position: "absolute", bottom: 6, right: 6,
    background: "rgba(245,158,11,0.95)", color: "#fff",
    borderRadius: 999, padding: "2px 6px", fontSize: "0.64rem", fontWeight: 800,
  },
  typeBadge: {
    position: "absolute", bottom: 6, left: 6,
    background: "rgba(37,99,235,0.95)", color: "#fff",
    borderRadius: 999, padding: "2px 6px", fontSize: "0.64rem", fontWeight: 800,
  },
  cardTitle: {
    margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#dfe8f4",
    lineHeight: 1.3, display: "-webkit-box",
    WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  cardTags: { margin: 0, fontSize: "0.7rem", color: "#475569", fontWeight: 600 },
  empty: { textAlign: "center", padding: "32px 0" },
  emptyTitle: { margin: "0 0 6px", fontWeight: 800, color: "#f1f5f9", fontSize: "1rem" },
  emptyText: { margin: 0, color: "#475569", fontSize: "0.88rem", lineHeight: 1.5 },
};
