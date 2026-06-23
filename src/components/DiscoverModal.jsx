import React, { useState, useEffect, useRef } from "react";
import { normalizeTitle } from "../lib/seriesUtils";

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapMangaDexResult(manga) {
  const { id, attributes, relationships } = manga;
  const coverRel = (relationships || []).find((r) => r.type === "cover_art");
  const fileName = coverRel?.attributes?.fileName;
  const image = fileName
    ? `https://uploads.mangadex.org/covers/${id}/${fileName}.512.jpg`
    : "";
  const title =
    attributes?.title?.en ||
    Object.values(attributes?.title || {})[0] ||
    "Untitled";
  const tags = (attributes?.tags || [])
    .map((t) => t.attributes?.name?.en)
    .filter(Boolean)
    .slice(0, 5);
  const altTitleObjs = attributes?.altTitles || [];
  const altTitles = altTitleObjs
    .flatMap((obj) => Object.values(obj))
    .filter(Boolean)
    .slice(0, 3);
  const rawStatus = attributes?.publicationDemographic || "";
  const typeMap = { shounen: "manga", shoujo: "manga", josei: "manga", seinen: "manga" };
  return {
    mdId: id,
    mediaCategory: "comics",
    title,
    image,
    type: typeMap[rawStatus] || "manga",
    status: "notRead",
    summary: attributes?.description?.en || "",
    altTitles,
    tags,
    needsReview: false,
    currentProgress: 0,
    totalProgress: attributes?.lastChapter ? parseInt(attributes.lastChapter) || null : null,
    rating: null,
  };
}

function mapJikanManga(r) {
  const rawType = (r.type || "").toLowerCase();
  const typeMap = { manhwa: "manhwa", manhua: "manhua", manga: "manga", "one-shot": "manga" };
  return {
    malId: r.mal_id,
    mediaCategory: "comics",
    title: r.title_english || r.title || "Untitled",
    image: r.images?.jpg?.large_image_url || r.images?.jpg?.image_url || "",
    type: typeMap[rawType] || "manga",
    status: "notRead",
    summary: r.synopsis || "",
    altTitles: [r.title, r.title_japanese]
      .filter(Boolean)
      .filter((t) => t !== (r.title_english || r.title)),
    tags: [],
    needsReview: false,
    currentProgress: 0,
    totalProgress: r.chapters && r.chapters > 0 ? r.chapters : null,
    rating: null,
  };
}

function mapJikanAnime(r) {
  const rawType = (r.type || "").toLowerCase();
  const typeMap = { tv: "tv", movie: "movie", ova: "ova", ona: "ona", special: "special" };
  return {
    malId: r.mal_id,
    mediaCategory: "anime",
    title: r.title_english || r.title || "Untitled",
    image: r.images?.jpg?.large_image_url || r.images?.jpg?.image_url || "",
    type: typeMap[rawType] || "tv",
    status: "notRead",
    summary: r.synopsis || "",
    altTitles: [r.title, r.title_japanese]
      .filter(Boolean)
      .filter((t) => t !== (r.title_english || r.title)),
    tags: [],
    needsReview: false,
    currentProgress: 0,
    totalProgress: r.episodes && r.episodes > 0 ? r.episodes : null,
    rating: null,
  };
}

// ── Status picker (shown on "+ Add" click) ────────────────────────────────────

const STATUS_QUICK = [
  { key: "reading",  label: "Reading",      emoji: "📖" },
  { key: "readNext", label: "Want to Read",  emoji: "🔖" },
  { key: "notRead",  label: "Backlog",       emoji: "📚" },
];

function StatusPicker({ onPick, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);
  return (
    <div ref={ref} style={s.picker}>
      {STATUS_QUICK.map((opt) => (
        <button key={opt.key} onClick={() => onPick(opt.key)} style={s.pickerBtn}>
          <span>{opt.emoji}</span>
          <span style={s.pickerLabel}>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Cover card ────────────────────────────────────────────────────────────────

function CoverCard({ result, added, onAdd }) {
  const [picking, setPicking] = useState(false);

  function handleAddClick(e) {
    e.stopPropagation();
    setPicking(true);
  }
  function handlePick(status) {
    setPicking(false);
    onAdd(result, status);
  }

  return (
    <div style={s.card}>
      <div style={s.coverWrap}>
        {result.image ? (
          <img
            src={result.image}
            alt={result.title}
            style={s.coverImg}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div style={s.noCover}>
            <span style={s.noCoverInitial}>{result.title[0]?.toUpperCase()}</span>
          </div>
        )}

        {result.rank && (
          <div style={s.rankBadge}>#{result.rank}</div>
        )}

        <div style={s.cardOverlay}>
          {added ? (
            <span style={s.addedBadge}>✓ Added</span>
          ) : (
            <button onClick={handleAddClick} style={s.addBtn}>+ Track</button>
          )}
        </div>

        {picking && (
          <div style={s.pickerWrap} onClick={(e) => e.stopPropagation()}>
            <StatusPicker onPick={handlePick} onClose={() => setPicking(false)} />
          </div>
        )}
      </div>
      <p style={s.cardTitle}>{result.title}</p>
      <p style={s.cardMeta}>
        {result.mediaCategory === "anime" ? "Anime" : result.type?.charAt(0).toUpperCase() + result.type?.slice(1)}
        {result.totalProgress ? ` · ${result.mediaCategory === "anime" ? result.totalProgress + " ep" : result.totalProgress + " ch"}` : ""}
      </p>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "trending",  label: "Trending"  },
  { key: "search",    label: "Search"    },
  { key: "seasonal",  label: "Seasonal"  },
];

export default function DiscoverModal({ onClose, onAdd, existingTitles }) {
  const [activeTab, setActiveTab]   = useState("trending");
  const [trendFilter, setTrendFilter] = useState("all"); // "all" | "comics" | "anime"

  const [trendResults, setTrendResults]   = useState([]);
  const [trendLoaded, setTrendLoaded]     = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);

  const [query, setQuery]             = useState("");
  const [searchCat, setSearchCat]     = useState("comics");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched]       = useState(false);

  const [seasonalResults, setSeasonalResults] = useState([]);
  const [seasonalLoaded, setSeasonalLoaded]   = useState(false);
  const [isLoadingSeasonal, setIsLoadingSeasonal] = useState(false);

  const [addedIds, setAddedIds] = useState(new Set());

  // Load trending immediately on mount
  useEffect(() => { loadTrending(); }, []);

  useEffect(() => {
    if (activeTab === "seasonal" && !seasonalLoaded) loadSeasonal();
  }, [activeTab]);

  async function loadTrending() {
    if (trendLoaded) return;
    setIsLoadingTrend(true);
    try {
      const [mangaRes, animeRes] = await Promise.all([
        fetch("https://api.jikan.moe/v4/top/manga?limit=20&sfw=true"),
        fetch("https://api.jikan.moe/v4/top/anime?limit=20&sfw=true"),
      ]);
      const [mangaJson, animeJson] = await Promise.all([mangaRes.json(), animeRes.json()]);
      const manga = (mangaJson?.data || []).map((r) => ({ ...mapJikanManga(r), rank: r.rank }));
      const anime = (animeJson?.data || []).map((r) => ({ ...mapJikanAnime(r), rank: r.rank }));
      setTrendResults([...manga, ...anime]);
      setTrendLoaded(true);
    } catch { setTrendResults([]); }
    finally { setIsLoadingTrend(false); }
  }

  async function loadSeasonal() {
    setIsLoadingSeasonal(true);
    try {
      const res = await fetch("https://api.jikan.moe/v4/seasons/now?limit=24&sfw=true");
      const json = await res.json();
      setSeasonalResults((json?.data || []).map(mapJikanAnime));
      setSeasonalLoaded(true);
    } catch { setSeasonalResults([]); }
    finally { setIsLoadingSeasonal(false); }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearched(true);
    setSearchResults([]);
    try {
      if (searchCat === "comics") {
        // Try MangaDex first for comics
        const res = await fetch(
          `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=20` +
          `&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`
        );
        if (res.ok) {
          const json = await res.json();
          const results = (json?.data || []).map(mapMangaDexResult);
          if (results.length) { setSearchResults(results); return; }
        }
        // Fallback to Jikan
        const fallback = await fetch(
          `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=20&sfw=true`
        );
        const fallbackJson = await fallback.json();
        setSearchResults((fallbackJson?.data || []).map(mapJikanManga));
      } else {
        const res = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=20&sfw=true`
        );
        const json = await res.json();
        setSearchResults((json?.data || []).map(mapJikanAnime));
      }
    } catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  }

  function isInLibrary(result) {
    const check = (t) => t && existingTitles.has(normalizeTitle(t));
    return check(result.title) || (result.altTitles || []).some(check);
  }

  function isAdded(result) {
    const id = result.malId ?? result.mdId ?? result.title;
    return isInLibrary(result) || addedIds.has(id);
  }

  function handleAdd(result, status = "notRead") {
    const { malId, mdId, rank, ...seriesData } = result;
    onAdd({ ...seriesData, status });
    const id = malId ?? mdId ?? result.title;
    setAddedIds((prev) => new Set([...prev, id]));
  }

  function resultKey(r) { return r.malId ?? r.mdId ?? r.title; }

  const visibleTrend = trendFilter === "all"
    ? trendResults
    : trendResults.filter((r) => r.mediaCategory === trendFilter);

  const activeResults =
    activeTab === "trending" ? visibleTrend :
    activeTab === "search"   ? searchResults :
    seasonalResults;

  const isLoading =
    activeTab === "trending" ? isLoadingTrend :
    activeTab === "search"   ? isSearching :
    isLoadingSeasonal;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} className="pv-modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.heading}>Discover</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Tabs */}
        <div style={s.tabRow}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ ...s.tab, ...(activeTab === tab.key ? s.tabActive : {}) }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab-specific controls */}
        {activeTab === "trending" && (
          <div style={s.filterRow}>
            {[["all", "All"], ["comics", "Manga"], ["anime", "Anime"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTrendFilter(key)}
                style={{ ...s.filterBtn, ...(trendFilter === key ? s.filterBtnActive : {}) }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {activeTab === "search" && (
          <>
            <div style={s.filterRow}>
              {[["comics", "Manga / Manhwa"], ["anime", "Anime"]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setSearchCat(key); setSearchResults([]); setSearched(false); }}
                  style={{ ...s.filterBtn, ...(searchCat === key ? s.filterBtnActive : {}) }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={s.searchRow}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={`Search ${searchCat === "anime" ? "anime" : "manga, manhwa, manhua"}…`}
                style={s.searchInput}
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                style={{ ...s.searchBtn, opacity: isSearching || !query.trim() ? 0.55 : 1 }}
              >
                {isSearching ? "…" : "Search"}
              </button>
            </div>
            {searched && !isSearching && searchResults.length === 0 && (
              <p style={s.emptyMsg}>No results — try a different spelling.</p>
            )}
          </>
        )}

        {activeTab === "seasonal" && (
          <p style={s.tabDesc}>Currently airing anime this season</p>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={s.loadingWrap}>
            {[...Array(8)].map((_, i) => <div key={i} style={s.skeleton} />)}
          </div>
        )}

        {/* Grid */}
        {!isLoading && activeResults.length > 0 && (
          <div style={s.grid}>
            {activeResults.map((result) => (
              <CoverCard
                key={resultKey(result)}
                result={result}
                added={isAdded(result)}
                onAdd={handleAdd}
              />
            ))}
          </div>
        )}

        <p style={s.footer}>
          {activeTab === "trending" || activeTab === "seasonal"
            ? "Data from MyAnimeList · Click + Track to add to your library"
            : "Search powered by MangaDex & MyAnimeList · Click + Track to add"}
        </p>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(2,6,23,0.88)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px", zIndex: 1000,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  modal: {
    width: "100%", maxWidth: 860,
    maxHeight: "92vh", overflowY: "auto",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26, padding: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    display: "flex", flexDirection: "column", gap: 14,
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  heading: {
    margin: 0, fontSize: "1.5rem", fontWeight: 900,
    color: "#fff", letterSpacing: "-0.03em",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "#94a3b8", cursor: "pointer",
    width: 36, height: 36, fontSize: "1rem",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  tabRow: {
    display: "flex", borderRadius: 14, overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  tab: {
    flex: 1, padding: "10px 0",
    background: "rgba(255,255,255,0.04)",
    color: "#94a3b8", border: "none",
    fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
  },
  tabActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
  },
  filterRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  filterBtn: {
    padding: "8px 16px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#dbe4f0", cursor: "pointer",
    fontWeight: 700, fontSize: "0.88rem",
  },
  filterBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff", border: "none",
    boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
  },
  searchRow: { display: "flex", gap: 10 },
  searchInput: {
    flex: 1, boxSizing: "border-box", borderRadius: 14,
    outline: "none", fontSize: "1rem", padding: "12px 16px",
    color: "#f8fafc", background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  searchBtn: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff", border: "none", borderRadius: 14,
    padding: "12px 22px", fontWeight: 800, whiteSpace: "nowrap",
    boxShadow: "0 8px 20px rgba(99,102,241,0.22)", cursor: "pointer",
    fontSize: "0.95rem",
  },
  tabDesc: { margin: 0, color: "#64748b", fontSize: "0.88rem" },
  emptyMsg: { color: "#94a3b8", textAlign: "center", margin: 0 },
  loadingWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 12,
  },
  skeleton: {
    aspectRatio: "2 / 3", borderRadius: 14,
    background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.07))",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 14,
  },
  // CoverCard styles
  card: { display: "flex", flexDirection: "column", gap: 6 },
  coverWrap: {
    width: "100%", aspectRatio: "2 / 3",
    borderRadius: 14, overflow: "hidden",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.07)",
    position: "relative",
    cursor: "pointer",
  },
  coverImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noCover: {
    width: "100%", height: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
  },
  noCoverInitial: {
    fontSize: "2.5rem", fontWeight: 900,
    color: "rgba(99,102,241,0.4)",
  },
  rankBadge: {
    position: "absolute", top: 7, left: 7,
    background: "rgba(245,158,11,0.9)",
    color: "#fff", borderRadius: 6,
    padding: "2px 7px", fontSize: "0.68rem", fontWeight: 800,
  },
  cardOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    background: "linear-gradient(to top, rgba(2,6,23,0.92) 0%, transparent 100%)",
    display: "flex", justifyContent: "center",
    paddingBottom: 10, paddingTop: 28,
  },
  addBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: 8,
    padding: "6px 14px", fontWeight: 800, fontSize: "0.8rem",
    cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
  },
  addedBadge: {
    background: "rgba(34,197,94,0.2)",
    color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: 8, padding: "5px 10px",
    fontWeight: 800, fontSize: "0.78rem",
  },
  cardTitle: {
    margin: 0, fontSize: "0.82rem", fontWeight: 700,
    color: "#e2e8f0", lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardMeta: {
    margin: 0, fontSize: "0.72rem", fontWeight: 700,
    color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em",
  },
  // StatusPicker
  pickerWrap: {
    position: "absolute", inset: 0,
    background: "rgba(2,6,23,0.92)",
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 14,
  },
  picker: {
    display: "flex", flexDirection: "column", gap: 6,
    padding: "10px 8px", width: "90%",
  },
  pickerBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "9px 12px",
    cursor: "pointer", color: "#f1f5f9",
    fontWeight: 700, fontSize: "0.82rem",
  },
  pickerLabel: { flex: 1, textAlign: "left" },
  footer: {
    margin: 0, textAlign: "center",
    color: "#334155", fontSize: "0.75rem",
  },
};
