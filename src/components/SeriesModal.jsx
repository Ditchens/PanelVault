import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  STATUS_OPTIONS,
  COMICS_TYPE_OPTIONS,
  ANIME_TYPE_OPTIONS,
  COMICS_TAG_OPTIONS,
  ANIME_TAG_OPTIONS,
  getStatusOptionLabel,
} from "../lib/constants";
import {
  uniqueNormalizedStrings,
  parseAltTitlesText,
  formatAltTitlesText,
  formatTypeLabel,
  formatStatusLabel,
} from "../lib/seriesUtils";

const NOTES_KEY = "panelvault_notes";
function loadNote(id) {
  try { return (JSON.parse(localStorage.getItem(NOTES_KEY) || "{}"))[id] || ""; } catch { return ""; }
}
function saveNote(id, text) {
  try {
    const all = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
    if (text.trim()) all[id] = text.trim();
    else delete all[id];
    localStorage.setItem(NOTES_KEY, JSON.stringify(all));
  } catch {}
}

// Props:
//   selectedItem       — the series object being viewed
//   onClose            — () => void
//   onSave             — async (id, updates) => boolean
//   onDelete           — async (id) => void
//   lists              — array of { id, name, itemIds }
//   onToggleInList     — (listId, seriesId) => void
//   onCheckConflict    — (title, altTitles, excludeId) => boolean
export default function SeriesModal({
  selectedItem,
  onClose,
  onSave,
  onDelete,
  lists,
  onToggleInList,
  onCheckConflict,
  currentUser,
}) {
  const [detailMode, setDetailMode] = useState("info");
  const [editTitle, setEditTitle] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editMediaCategory, setEditMediaCategory] = useState("comics");
  const [editType, setEditType] = useState("");
  const [editStatus, setEditStatus] = useState("notRead");
  const [editSummary, setEditSummary] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [editNeedsReview, setEditNeedsReview] = useState(false);
  const [editAltTitlesText, setEditAltTitlesText] = useState("");
  const [editCurrentProgress, setEditCurrentProgress] = useState(0);
  const [editTotalProgress, setEditTotalProgress] = useState("");
  const [editRating, setEditRating] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localProgress, setLocalProgress] = useState(null);
  const [localStatus, setLocalStatus] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // Cover search
  const [coverQuery, setCoverQuery] = useState("");
  const [coverResults, setCoverResults] = useState([]);
  const [isCoverSearching, setIsCoverSearching] = useState(false);

  // Sync edit state whenever the viewed item changes
  useEffect(() => {
    if (!selectedItem) return;
    setDetailMode("info");
    setEditTitle(selectedItem.title || "");
    setEditImage(selectedItem.image || "");
    setEditMediaCategory(selectedItem.mediaCategory || "comics");
    setEditType(selectedItem.type || "");
    setEditStatus(selectedItem.status || "notRead");
    setEditSummary(selectedItem.summary || "");
    setEditTags(Array.isArray(selectedItem.tags) ? selectedItem.tags : []);
    setEditNeedsReview(!!selectedItem.needsReview);
    setEditAltTitlesText(formatAltTitlesText(selectedItem.altTitles));
    setEditCurrentProgress(selectedItem.currentProgress ?? 0);
    setEditTotalProgress(selectedItem.totalProgress != null ? String(selectedItem.totalProgress) : "");
    setEditRating(selectedItem.rating ?? null);
    setEditNotes(loadNote(selectedItem.id));
    setLocalProgress(null);
    setLocalStatus(null);
    setSaveError("");
    setCoverQuery(selectedItem.title || "");
    setCoverResults([]);
  }, [selectedItem?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") { onClose(); return; }
      if (detailMode === "edit" && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [detailMode, editTitle, editImage, editMediaCategory, editType, editStatus, editSummary, editTags, editNeedsReview, editAltTitlesText]);

  async function handleSave() {
    setSaveError("");
    if (!editTitle.trim()) { setSaveError("Title cannot be empty."); return; }

    const parsedAltTitles = parseAltTitlesText(editAltTitlesText, editTitle);

    if (onCheckConflict(editTitle.trim(), parsedAltTitles, selectedItem.id)) {
      setSaveError("This title or one of its alternate titles already belongs to another entry.");
      return;
    }

    setIsSaving(true);
    const parsedTotal =
      editTotalProgress !== "" && !isNaN(Number(editTotalProgress)) && Number(editTotalProgress) > 0
        ? Number(editTotalProgress)
        : null;
    const ok = await onSave(selectedItem.id, {
      title: editTitle.trim(),
      image: editImage.trim(),
      mediaCategory: editMediaCategory,
      type: editType,
      status: editStatus,
      summary: editSummary.trim(),
      tags: uniqueNormalizedStrings(editTags),
      altTitles: parsedAltTitles,
      needsReview: editNeedsReview,
      currentProgress: Math.max(0, Number(editCurrentProgress) || 0),
      totalProgress: parsedTotal,
      rating: editRating,
    });
    setIsSaving(false);
    if (ok) {
      saveNote(selectedItem.id, editNotes);
      setDetailMode("info");
    }
  }

  function quickStatusChange(newStatus) {
    setLocalStatus(newStatus);
    onSave(selectedItem.id, {
      title: selectedItem.title,
      image: selectedItem.image || "",
      mediaCategory: selectedItem.mediaCategory || "comics",
      type: selectedItem.type || "",
      status: newStatus,
      summary: selectedItem.summary || "",
      tags: selectedItem.tags || [],
      altTitles: selectedItem.altTitles || [],
      needsReview: false,
      currentProgress: selectedItem.currentProgress || 0,
      totalProgress: selectedItem.totalProgress ?? null,
      rating: selectedItem.rating ?? null,
    });
  }

  function quickIncrement(n) {
    const base = localProgress ?? selectedItem?.currentProgress ?? 0;
    const newProg = Math.max(0, base + n);
    setLocalProgress(newProg);
    onSave(selectedItem.id, {
      title: selectedItem.title,
      image: selectedItem.image || "",
      mediaCategory: selectedItem.mediaCategory || "comics",
      type: selectedItem.type || "",
      status: selectedItem.status || "notRead",
      summary: selectedItem.summary || "",
      tags: selectedItem.tags || [],
      altTitles: selectedItem.altTitles || [],
      needsReview: !!selectedItem.needsReview,
      currentProgress: newProg,
      totalProgress: selectedItem.totalProgress ?? null,
      rating: selectedItem.rating ?? null,
    });
  }

  async function uploadCover(file) {
    if (!supabase || !currentUser) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5 MB."); return; }

    setIsUploading(true);
    setUploadError("");

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${currentUser.id}/${selectedItem.id}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("covers")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      setUploadError("Upload failed: " + error.message);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    setEditImage(data.publicUrl);
    setIsUploading(false);
  }

  async function searchCovers() {
    if (!coverQuery.trim()) return;
    setIsCoverSearching(true);
    setCoverResults([]);
    try {
      const res = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(coverQuery.trim())}&limit=12` +
        `&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`
      );
      if (res.ok) {
        const data = await res.json();
        const results = [];
        for (const manga of (data?.data || [])) {
          const coverRel = (manga.relationships || []).find((r) => r.type === "cover_art");
          const filename = coverRel?.attributes?.fileName;
          if (filename) {
            const title = manga.attributes?.title?.en
              || Object.values(manga.attributes?.title || {})[0]
              || "Unknown";
            results.push({
              id: manga.id,
              title,
              imageUrl: `https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`,
            });
          }
        }
        setCoverResults(results);
      }
    } catch {}
    setIsCoverSearching(false);
  }

  function toggleTag(tag) {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // When the user switches media category in edit mode, clear the type if it's
  // no longer valid for the new category.
  function handleCategorySwitch(cat) {
    setEditMediaCategory(cat);
    const validTypes =
      cat === "anime"
        ? ANIME_TYPE_OPTIONS.map((o) => o.key)
        : COMICS_TYPE_OPTIONS.map((o) => o.key);
    if (!validTypes.includes(editType)) setEditType("");
    setEditTags([]);
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const itemCat  = selectedItem?.mediaCategory || "comics";
  const typeOpts = editMediaCategory === "anime" ? ANIME_TYPE_OPTIONS : COMICS_TYPE_OPTIONS;
  const tagOpts  = editMediaCategory === "anime" ? ANIME_TAG_OPTIONS  : COMICS_TAG_OPTIONS;

  function getExternalLink(item) {
    const cat = item.mediaCategory || "comics";
    if (cat === "anime") {
      return {
        label: "Search on MAL",
        url: `https://myanimelist.net/search/all?q=${encodeURIComponent(item.title)}&cat=anime`,
      };
    }
    // Extract MangaDex manga ID from cover URL if available
    if (item.image?.includes("uploads.mangadex.org/covers/")) {
      const id = item.image.split("/covers/")[1]?.split("/")[0];
      if (id) return { label: "Read on MangaDex", url: `https://mangadex.org/title/${id}` };
    }
    return {
      label: "Search on MangaDex",
      url: `https://mangadex.org/search?q=${encodeURIComponent(item.title)}`,
    };
  }

  const listsContainingItem = new Set(
    lists.filter((l) => l.itemIds.includes(selectedItem?.id)).map((l) => l.id)
  );

  const displayedProgress = localProgress ?? selectedItem?.currentProgress ?? 0;
  const displayedStatus = localStatus ?? selectedItem?.status ?? "notRead";
  const progressPct = selectedItem?.totalProgress
    ? Math.min(100, (displayedProgress / selectedItem.totalProgress) * 100)
    : null;

  return (
    <div style={{ ...s.overlay, padding: isMobile ? "0" : "20px" }} onClick={onClose}>
      <div
        style={{
          ...s.modal,
          borderRadius: isMobile ? "24px 24px 0 0" : 26,
          maxHeight: isMobile ? "92vh" : "90vh",
          ...(isMobile ? { position: "fixed", bottom: 0, left: 0, right: 0, width: "100%" } : {}),
        }}
        className="pv-modal-content"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── INFO VIEW ────────────────────────────────────────────── */}
        {detailMode === "info" ? (
          <>
            {/* Modal header row */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setDetailMode("edit")}
                style={s.iconBtn}
                title="Edit details"
              >
                ✎
              </button>
              <button onClick={onClose} style={s.iconBtn} title="Close">✕</button>
            </div>

            <div style={{ ...s.top, flexDirection: isMobile ? "column" : "row" }}>
              <div style={{
                ...s.previewWrap,
                width: isMobile ? "100%" : 150,
                aspectRatio: isMobile ? "16 / 9" : "2 / 3",
                borderRadius: isMobile ? 14 : 16,
              }}>
                {selectedItem.image ? (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    style={{ ...s.previewImg, objectPosition: isMobile ? "center top" : "center" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      if (e.currentTarget.nextSibling)
                        e.currentTarget.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div style={{ ...s.noCover, display: selectedItem.image ? "none" : "flex" }}>
                  No Cover
                </div>
              </div>

              <div style={s.topInfo}>
                <div style={s.categoryBadge}>
                  {itemCat === "anime" ? "Anime" : "Comics"}
                </div>
                <h2 style={s.title}>{selectedItem.title}</h2>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                  <select
                    value={displayedStatus}
                    onChange={(e) => quickStatusChange(e.target.value)}
                    style={{
                      ...s.statusBadge,
                      ...(statusColors[displayedStatus] || statusColors.notRead),
                      cursor: "pointer",
                      appearance: "none",
                      WebkitAppearance: "none",
                      paddingRight: 26,
                      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 8px center",
                      backgroundSize: "9px",
                    }}
                  >
                    {STATUS_OPTIONS.filter(o => o.key !== "all" && o.key !== "needsReview").map(o => (
                      <option key={o.key} value={o.key} style={{ background: "#0f172a", color: "#f8fafc" }}>
                        {getStatusOptionLabel(o, itemCat)}
                      </option>
                    ))}
                  </select>
                  {selectedItem.type && (
                    <span style={s.typeBadgeMeta}>
                      {formatTypeLabel(selectedItem.type)}
                    </span>
                  )}
                </div>
                {(displayedProgress > 0 || selectedItem.totalProgress != null) && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                      <span style={{ ...s.meta, margin: 0 }}>
                        {itemCat === "anime" ? "Ep." : "Ch."}{" "}
                        <strong>{displayedProgress}</strong>
                        {selectedItem.totalProgress != null ? ` / ${selectedItem.totalProgress}` : ""}
                      </span>
                      <button onClick={() => quickIncrement(1)} style={s.incBtn}>+1</button>
                      <button onClick={() => quickIncrement(5)} style={s.incBtn}>+5</button>
                    </div>
                    {progressPct !== null && (
                      <div style={s.progressTrack}>
                        <div style={{ ...s.progressFill, width: `${progressPct}%` }} />
                      </div>
                    )}
                  </div>
                )}
                {selectedItem.rating != null ? (
                  <p style={s.meta}>
                    Rating: <strong style={s.ratingDisplay}>{selectedItem.rating} / 10</strong>
                  </p>
                ) : null}

                {/* External link */}
                {(() => {
                  const link = getExternalLink(selectedItem);
                  return (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={s.externalLink}
                    >
                      {link.label} ↗
                    </a>
                  );
                })()}
              </div>
            </div>

            {selectedItem.altTitles?.length > 0 && (
              <div style={s.block}>
                <p style={s.blockTitle}>Alternate Titles</p>
                <div style={s.tagWrap}>
                  {selectedItem.altTitles.map((alt) => (
                    <span key={alt} style={s.pill}>{alt}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.tags.length > 0 && (
              <div style={s.block}>
                <p style={s.blockTitle}>Tags</p>
                <div style={s.tagWrap}>
                  {selectedItem.tags.map((tag) => (
                    <span key={tag} style={s.pill}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.summary?.trim() && (
              <div style={s.block}>
                <p style={s.blockTitle}>Summary</p>
                <p style={s.summary}>{selectedItem.summary}</p>
              </div>
            )}

            {(() => {
              const note = loadNote(selectedItem.id);
              if (!note) return null;
              return (
                <div style={s.block}>
                  <p style={s.blockTitle}>Personal Notes</p>
                  <p style={{ ...s.summary, borderLeft: "3px solid rgba(99,102,241,0.4)", paddingLeft: 12 }}>
                    {note}
                  </p>
                </div>
              );
            })()}

            {lists.length > 0 && (
              <div style={s.block}>
                <p style={s.blockTitle}>My Lists</p>
                <div style={s.tagWrap}>
                  {lists.map((list) => {
                    const inList = listsContainingItem.has(list.id);
                    return (
                      <button
                        key={list.id}
                        onClick={() => onToggleInList(list.id, selectedItem.id)}
                        style={{ ...s.listBtn, ...(inList ? s.listBtnActive : {}) }}
                      >
                        {inList ? "✓ " : "+ "}{list.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </>

        ) : (
          /* ── EDIT VIEW ───────────────────────────────────────────── */
          <>
            <div style={{ ...s.top, flexDirection: isMobile ? "column" : "row" }}>
              <div style={{ ...s.previewWrap, width: isMobile ? "100%" : 150, aspectRatio: isMobile ? "16 / 9" : "2 / 3", borderRadius: isMobile ? 14 : 16 }}>
                {editImage ? (
                  <img
                    src={editImage}
                    alt={editTitle}
                    style={{ ...s.previewImg, objectPosition: isMobile ? "center top" : "center" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      if (e.currentTarget.nextSibling)
                        e.currentTarget.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div style={{ ...s.noCover, display: editImage ? "none" : "flex" }}>
                  No Cover
                </div>
              </div>
              <div style={s.topInfo}>
                <h2 style={s.title}>Edit Series</h2>
                <p style={s.hint}>Esc = close</p>
                <p style={s.hint}>Cmd/Ctrl + Enter = save</p>
              </div>
            </div>

            <label style={s.label}>Category</label>
            <div style={s.tagWrap}>
              {["comics", "anime"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySwitch(cat)}
                  style={{
                    ...s.toggle,
                    ...(editMediaCategory === cat ? s.toggleActive : {}),
                  }}
                >
                  {cat === "anime" ? "Anime" : "Comics"}
                </button>
              ))}
            </div>

            <label style={s.label}>Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Edit title"
              style={s.input}
            />

            <label style={s.label}>Alternate Titles</label>
            <textarea
              value={editAltTitlesText}
              onChange={(e) => setEditAltTitlesText(e.target.value)}
              placeholder={"One alternate title per line\nExample:\nReturn of the Mad Demon"}
              style={s.textarea}
            />

            <label style={s.label}>Cover</label>
            <input
              value={editImage}
              onChange={(e) => setEditImage(e.target.value)}
              placeholder="Paste a cover URL…"
              style={s.input}
            />

            {/* MangaDex cover search */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={coverQuery}
                onChange={(e) => setCoverQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") searchCovers(); }}
                placeholder="Search MangaDex for cover…"
                style={{ ...s.input, flex: 1, marginTop: 0, padding: "9px 12px", fontSize: "0.88rem" }}
              />
              <button
                type="button"
                onClick={searchCovers}
                disabled={isCoverSearching}
                style={s.searchCoverBtn}
              >
                {isCoverSearching ? "…" : "Search"}
              </button>
            </div>
            {coverResults.length > 0 && (
              <div style={s.coverResultsRow}>
                {coverResults.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setEditImage(r.imageUrl.replace(".256.jpg", ".512.jpg")); setCoverResults([]); }}
                    style={s.coverThumb}
                    title={r.title}
                  >
                    <img src={r.imageUrl} alt={r.title} style={s.coverThumbImg} />
                    <span style={s.coverThumbTitle}>{r.title}</span>
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadCover(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => { setUploadError(""); fileInputRef.current?.click(); }}
                disabled={isUploading || !currentUser || !supabase}
                style={{ ...s.uploadBtn, opacity: isUploading || !currentUser ? 0.6 : 1 }}
              >
                {isUploading ? "Uploading…" : "Upload Image"}
              </button>
              {!currentUser && <span style={s.uploadHint}>Sign in to upload</span>}
              {uploadError && <span style={s.uploadErrMsg}>{uploadError}</span>}
            </div>

            <label style={s.label}>Type</label>
            <select value={editType} onChange={(e) => setEditType(e.target.value)} style={s.input}>
              <option value="">Select type</option>
              {typeOpts
                .filter((o) => o.key !== "all")
                .map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
            </select>

            <label style={s.label}>Status</label>
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={s.input}>
              {STATUS_OPTIONS
                .filter((o) => o.key !== "all" && o.key !== "needsReview")
                .map((o) => (
                  <option key={o.key} value={o.key}>
                    {getStatusOptionLabel(o, editMediaCategory)}
                  </option>
                ))}
            </select>

            <label style={s.label}>Summary</label>
            <textarea
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              placeholder="Add a short summary..."
              style={s.textarea}
            />

            <label style={s.label}>Personal Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Your thoughts, reviews, what to read next..."
              style={{ ...s.textarea, minHeight: 80 }}
            />

            <label style={s.label}>Tags</label>
            <div style={s.tagWrap}>
              {tagOpts.map((tag) => {
                const active = editTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{ ...s.toggle, ...(active ? s.toggleActive : {}) }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <label style={s.label}>
              {editMediaCategory === "anime" ? "Episode Progress" : "Chapter Progress"}
            </label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="number"
                min="0"
                value={editCurrentProgress}
                onChange={(e) => setEditCurrentProgress(e.target.value)}
                placeholder="Current"
                style={{ ...s.input, width: "50%" }}
              />
              <span style={{ color: "#64748b", fontWeight: 700 }}>/</span>
              <input
                type="number"
                min="0"
                value={editTotalProgress}
                onChange={(e) => setEditTotalProgress(e.target.value)}
                placeholder="Total (optional)"
                style={{ ...s.input, width: "50%" }}
              />
            </div>

            <label style={s.label}>
              Rating:{" "}
              {editRating
                ? <strong style={s.ratingDisplay}>{editRating} / 10</strong>
                : <span style={{ color: "#475569", fontWeight: 600 }}>Not rated</span>}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={editRating || 0}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setEditRating(v === 0 ? null : v);
                }}
                style={{ flex: 1, accentColor: "#6366f1", cursor: "pointer" }}
              />
              {editRating && (
                <button type="button" onClick={() => setEditRating(null)} style={s.clearRating}>
                  Clear
                </button>
              )}
            </div>

            <label style={s.checkRow}>
              <input
                type="checkbox"
                checked={editNeedsReview}
                onChange={(e) => setEditNeedsReview(e.target.checked)}
              />
              <span>Keep this in Needs Review</span>
            </label>

            {saveError && <p style={s.saveError}>{saveError}</p>}

            <div style={s.buttons}>
              <button onClick={() => setDetailMode("info")} style={s.secondary}>Back</button>
              <button onClick={() => setEditImage("")} style={s.secondary}>Remove Cover</button>
              <button onClick={() => onDelete(selectedItem.id)} style={s.danger}>Delete</button>
              <button onClick={handleSave} disabled={isSaving} style={s.primary}>
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const statusColors = {
  reading:  { background: "rgba(34,197,94,0.15)",   color: "#86efac" },
  readNext: { background: "rgba(59,130,246,0.15)",  color: "#93c5fd" },
  notRead:  { background: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  finished: { background: "rgba(251,191,36,0.15)",  color: "#fcd34d" },
  dropped:  { background: "rgba(239,68,68,0.15)",   color: "#fca5a5" },
};

const ctrl = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 14,
  outline: "none",
  fontSize: "0.95rem",
  padding: "12px 14px",
  color: "#f8fafc",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "none",
  WebkitAppearance: "none",
  appearance: "none",
};

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 999,
  },
  modal: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26,
    padding: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,0.48)",
  },
  top: {
    display: "flex",
    gap: 18,
    alignItems: "flex-start",
    marginBottom: 18,
    flexWrap: "wrap",
  },
  previewWrap: {
    width: 150,
    aspectRatio: "2 / 3",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#111827",
    position: "relative",
    flexShrink: 0,
  },
  previewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  noCover: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    fontWeight: 800,
  },
  topInfo: {
    flex: 1,
    minWidth: 180,
  },
  categoryBadge: {
    display: "inline-block",
    background: "rgba(99,102,241,0.2)",
    color: "#a5b4fc",
    borderRadius: 999,
    padding: "3px 10px",
    fontSize: "0.78rem",
    fontWeight: 800,
    marginBottom: 8,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "1.35rem",
    fontWeight: 900,
    color: "#ffffff",
  },
  hint: {
    margin: "4px 0",
    color: "#cbd5e1",
    fontSize: "0.9rem",
  },
  meta: {
    margin: "6px 0",
    color: "#cbd5e1",
    fontSize: "0.95rem",
  },
  block: { marginTop: 16 },
  blockTitle: {
    margin: "0 0 10px 0",
    color: "#ffffff",
    fontWeight: 800,
    fontSize: "0.96rem",
  },
  summary: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
  },
  empty: {
    color: "#94a3b8",
    fontSize: "0.92rem",
  },
  tagWrap: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(99,102,241,0.18)",
    color: "#e9eaff",
    fontWeight: 700,
    fontSize: "0.84rem",
  },
  listBtn: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#dbe4f0",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.88rem",
  },
  listBtnActive: {
    background: "rgba(99,102,241,0.25)",
    border: "1px solid rgba(99,102,241,0.4)",
    color: "#a5b4fc",
  },
  label: {
    display: "block",
    marginBottom: 8,
    marginTop: 12,
    color: "#cbd5e1",
    fontWeight: 700,
    fontSize: "0.92rem",
  },
  input: { ...ctrl },
  textarea: { ...ctrl, minHeight: 110, resize: "vertical" },
  toggle: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#dbe4f0",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.88rem",
  },
  toggleActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
  },
  ratingDisplay: {
    color: "#fbbf24",
    fontSize: "1.05rem",
  },
  externalLink: {
    display: "inline-block",
    marginTop: 10,
    padding: "8px 14px",
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 10,
    color: "#a5b4fc",
    fontSize: "0.84rem",
    fontWeight: 700,
    textDecoration: "none",
  },
  statusBadge: {
    display: "inline-block",
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: "0.8rem",
    fontWeight: 800,
    letterSpacing: "0.01em",
  },
  typeBadgeMeta: {
    display: "inline-block",
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: "0.8rem",
    fontWeight: 700,
    background: "rgba(59,130,246,0.12)",
    color: "#93c5fd",
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
    borderRadius: 999,
    transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
  },
  incBtn: {
    padding: "4px 10px",
    borderRadius: 8,
    border: "1px solid rgba(99,102,241,0.35)",
    background: "rgba(99,102,241,0.12)",
    color: "#a5b4fc",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "0.78rem",
  },
  iconBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#64748b",
    cursor: "pointer",
    width: 34,
    height: 34,
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  clearRating: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 700,
    padding: "4px 8px",
    flexShrink: 0,
    borderRadius: 6,
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    color: "#dbe4f0",
    fontWeight: 700,
    cursor: "pointer",
  },
  buttons: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: 20,
  },
  primary: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(99,102,241,0.22)",
    whiteSpace: "nowrap",
  },
  secondary: {
    background: "rgba(255,255,255,0.08)",
    color: "#e2e8f0",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "11px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  danger: {
    background: "rgba(239,68,68,0.18)",
    color: "#fecaca",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 14,
    padding: "11px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  searchCoverBtn: {
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 10,
    color: "#a5b4fc",
    fontSize: "0.88rem",
    fontWeight: 700,
    padding: "9px 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  coverResultsRow: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 6,
    marginTop: 8,
    scrollbarWidth: "none",
  },
  coverThumb: {
    flexShrink: 0,
    width: 88,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 4,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  coverThumbImg: {
    width: "100%",
    aspectRatio: "2/3",
    objectFit: "cover",
    borderRadius: 7,
    display: "block",
  },
  coverThumbTitle: {
    fontSize: "0.62rem",
    color: "#94a3b8",
    fontWeight: 600,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: 1.3,
    textAlign: "left",
  },
  uploadBtn: {
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 10,
    color: "#a5b4fc",
    fontSize: "0.85rem",
    fontWeight: 700,
    padding: "8px 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  uploadHint: { fontSize: "0.8rem", color: "#64748b" },
  uploadErrMsg: { fontSize: "0.8rem", color: "#f87171", fontWeight: 600 },
  saveError: {
    margin: "12px 0 0",
    padding: "10px 14px",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 10,
    color: "#fca5a5",
    fontSize: "0.88rem",
    fontWeight: 600,
  },
};
