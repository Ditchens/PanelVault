import React, { useState } from "react";
import { normalizeTitle } from "../lib/seriesUtils";

const MANGA_STATUS = {
  "Reading":       "reading",
  "Completed":     "finished",
  "On-Hold":       "readNext",
  "Dropped":       "dropped",
  "Plan to Read":  "notRead",
};

const ANIME_STATUS = {
  "Watching":       "reading",
  "Completed":      "finished",
  "On-Hold":        "readNext",
  "Dropped":        "dropped",
  "Plan to Watch":  "notRead",
};

function getText(el, tag) {
  return el.querySelector(tag)?.textContent?.trim() || "";
}

function parseMALXml(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("Invalid XML file. Make sure you exported from MyAnimeList.");
  }

  const items = [];

  doc.querySelectorAll("manga").forEach((el) => {
    const title = getText(el, "series_title");
    if (!title) return;
    const rawStatus = getText(el, "my_status");
    const score     = parseInt(getText(el, "my_score")) || null;
    const current   = parseInt(getText(el, "my_read_chapters")) || 0;
    const total     = parseInt(getText(el, "series_chapters")) || null;
    items.push({
      title,
      mediaCategory: "comics",
      type: "manhwa",
      status: MANGA_STATUS[rawStatus] || "notRead",
      rating: score && score > 0 && score <= 10 ? score : null,
      currentProgress: current,
      totalProgress: total && total > 0 ? total : null,
      image: "",
      tags: [],
      summary: "",
      altTitles: [],
      needsReview: true,
    });
  });

  doc.querySelectorAll("anime").forEach((el) => {
    const title = getText(el, "series_title");
    if (!title) return;
    const rawStatus = getText(el, "my_status");
    const score     = parseInt(getText(el, "my_score")) || null;
    const current   = parseInt(getText(el, "my_watched_episodes")) || 0;
    const total     = parseInt(getText(el, "series_episodes")) || null;
    items.push({
      title,
      mediaCategory: "anime",
      type: "tv",
      status: ANIME_STATUS[rawStatus] || "notRead",
      rating: score && score > 0 && score <= 10 ? score : null,
      currentProgress: current,
      totalProgress: total && total > 0 ? total : null,
      image: "",
      tags: [],
      summary: "",
      altTitles: [],
      needsReview: true,
    });
  });

  return items;
}

const STATUS_LABEL = {
  reading:  "Reading / Watching",
  finished: "Finished",
  readNext: "On Hold",
  dropped:  "Dropped",
  notRead:  "Plan to Read/Watch",
};

export default function ImportModal({ onClose, onImport, existingTitles }) {
  const [parsed, setParsed]       = useState(null);
  const [error, setError]         = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [done, setDone]           = useState(false);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setParsed(null);
    setDone(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const items = parseMALXml(evt.target.result);
        if (items.length === 0) {
          setError("No manga or anime entries found. Is this a valid MAL export?");
          return;
        }
        setParsed(items);
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  }

  const newItems = parsed
    ? parsed.filter((item) => !existingTitles.has(normalizeTitle(item.title)))
    : [];

  const dupCount = parsed ? parsed.length - newItems.length : 0;

  const statusCounts = newItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  async function handleImport() {
    if (!newItems.length) return;
    setIsImporting(true);
    await onImport(newItems);
    setIsImporting(false);
    setDone(true);
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.heading}>Import from MAL</h2>
          <button onClick={onClose} style={s.closeBtn} aria-label="Close">✕</button>
        </div>

        {done ? (
          <div style={s.doneBox}>
            <div style={s.doneIcon}>✓</div>
            <p style={s.doneTitle}>Import complete!</p>
            <p style={s.doneSub}>
              {newItems.length} series added to your library.
            </p>
            <button onClick={onClose} style={s.primaryBtn}>Close</button>
          </div>
        ) : (
          <>
            <div style={s.instructions}>
              <p style={s.instructTitle}>How to export from MyAnimeList</p>
              <ol style={s.instructList}>
                <li>Go to <strong>myanimelist.net</strong> → Profile → Export</li>
                <li>Export both Manga List and Anime List (two separate XML files)</li>
                <li>Import each file here one at a time</li>
              </ol>
            </div>

            <label style={s.fileLabel}>
              <input
                type="file"
                accept=".xml"
                onChange={handleFile}
                style={{ display: "none" }}
              />
              <span style={s.fileBtn}>Choose XML File</span>
            </label>

            {error && <p style={s.error}>{error}</p>}

            {parsed && (
              <div style={s.preview}>
                <p style={s.previewTitle}>
                  Found <strong>{parsed.length}</strong> entries —{" "}
                  <strong style={{ color: "#4ade80" }}>{newItems.length} new</strong>
                  {dupCount > 0 && (
                    <span style={{ color: "#64748b" }}>, {dupCount} already in library</span>
                  )}
                </p>

                <div style={s.previewGrid}>
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} style={s.previewPill}>
                      <span style={s.previewPillLabel}>{STATUS_LABEL[status] || status}</span>
                      <span style={s.previewPillCount}>{count}</span>
                    </div>
                  ))}
                </div>

                <div style={s.previewList}>
                  {newItems.slice(0, 8).map((item, i) => (
                    <div key={i} style={s.previewRow}>
                      <span style={s.previewCat}>
                        {item.mediaCategory === "anime" ? "Anime" : "Comics"}
                      </span>
                      <span style={s.previewItemTitle}>{item.title}</span>
                      {item.rating && (
                        <span style={s.previewRating}>★{item.rating}</span>
                      )}
                    </div>
                  ))}
                  {newItems.length > 8 && (
                    <p style={s.previewMore}>…and {newItems.length - 8} more</p>
                  )}
                </div>

                <button
                  onClick={handleImport}
                  disabled={isImporting || newItems.length === 0}
                  style={{
                    ...s.primaryBtn,
                    opacity: isImporting || newItems.length === 0 ? 0.7 : 1,
                    cursor: isImporting || newItems.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {isImporting
                    ? "Importing…"
                    : `Import ${newItems.length} Series`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.88)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26,
    padding: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "-0.03em",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "1rem",
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  instructions: {
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 16,
    padding: "14px 18px",
  },
  instructTitle: {
    margin: "0 0 8px",
    fontWeight: 800,
    color: "#a5b4fc",
    fontSize: "0.9rem",
  },
  instructList: {
    margin: 0,
    paddingLeft: 18,
    color: "#94a3b8",
    fontSize: "0.88rem",
    lineHeight: 1.7,
  },
  fileLabel: {
    display: "block",
    cursor: "pointer",
  },
  fileBtn: {
    display: "block",
    textAlign: "center",
    background: "rgba(255,255,255,0.06)",
    border: "2px dashed rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: "18px",
    color: "#94a3b8",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  error: {
    margin: 0,
    color: "#f87171",
    fontSize: "0.88rem",
    fontWeight: 600,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: 10,
    padding: "10px 14px",
  },
  preview: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  previewTitle: {
    margin: 0,
    fontSize: "0.95rem",
    color: "#dbe4f0",
  },
  previewGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  previewPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    padding: "6px 12px",
  },
  previewPillLabel: {
    fontSize: "0.84rem",
    fontWeight: 700,
    color: "#dbe4f0",
  },
  previewPillCount: {
    fontSize: "0.8rem",
    fontWeight: 800,
    color: "#64748b",
  },
  previewList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: "10px 14px",
    maxHeight: 220,
    overflowY: "auto",
  },
  previewRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: "0.88rem",
  },
  previewCat: {
    flexShrink: 0,
    background: "rgba(99,102,241,0.2)",
    color: "#a5b4fc",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: "0.72rem",
    fontWeight: 800,
  },
  previewItemTitle: {
    flex: 1,
    color: "#dbe4f0",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  previewRating: {
    flexShrink: 0,
    color: "#fbbf24",
    fontWeight: 800,
    fontSize: "0.8rem",
  },
  previewMore: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "0.82rem",
    fontStyle: "italic",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "13px",
    fontWeight: 800,
    fontSize: "0.95rem",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(99,102,241,0.25)",
    width: "100%",
  },
  doneBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "24px 0",
  },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "rgba(34,197,94,0.15)",
    border: "2px solid rgba(34,197,94,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    color: "#4ade80",
  },
  doneTitle: {
    margin: 0,
    fontSize: "1.3rem",
    fontWeight: 900,
    color: "#ffffff",
  },
  doneSub: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "0.95rem",
  },
};
