import React, { useState, useEffect, useRef, useCallback } from "react";
import { normalizeTitle } from "../lib/seriesUtils";

// ── Fetch with 429 retry ──────────────────────────────────────────────────────
async function fetchWithRetry(url, retries = 2, baseDelay = 1200) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url);
    if (res.status === 429 && i < retries) {
      await new Promise((r) => setTimeout(r, baseDelay * (i + 1)));
      continue;
    }
    return res;
  }
}

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
    tags: (r.genres || []).map((g) => g.name).slice(0, 5),
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
    tags: (r.genres || []).map((g) => g.name).slice(0, 5),
    needsReview: false,
    currentProgress: 0,
    totalProgress: r.episodes && r.episodes > 0 ? r.episodes : null,
    rating: null,
  };
}

// ── Genre list (Jikan IDs) ────────────────────────────────────────────────────
const GENRES = [
  { id: 1,  name: "Action"        },
  { id: 2,  name: "Adventure"     },
  { id: 4,  name: "Comedy"        },
  { id: 10, name: "Fantasy"       },
  { id: 14, name: "Horror"        },
  { id: 22, name: "Romance"       },
  { id: 24, name: "Sci-Fi"        },
  { id: 36, name: "Slice of Life" },
  { id: 30, name: "Sports"        },
  { id: 37, name: "Supernatural"  },
  { id: 41, name: "Thriller"      },
];

// ── Status picker ─────────────────────────────────────────────────────────────
const STATUS_QUICK = [
  { key: "reading",  label: "Reading",     emoji: "📖" },
  { key: "readNext", label: "Want to Read", emoji: "🔖" },
  { key: "notRead",  label: "Backlog",      emoji: "📚" },
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

  function handleAddClick(e) { e.stopPropagation(); setPicking(true); }
  function handlePick(status) { setPicking(false); onAdd(result, status); }

  return (
    <div style={s.card}>
      <div style={s.coverWrap}>
        {result.image ? (
          <img src={result.image} alt={result.title} style={s.coverImg}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div style={s.noCover}>
            <span style={s.noCoverInitial}>{result.title[0]?.toUpperCase()}</span>
          </div>
        )}
        {result.rank && <div style={s.rankBadge}>#{result.rank}</div>}
        <div style={s.cardOverlay}>
          {added
            ? <span style={s.addedBadge}>✓ Added</span>
            : <button onClick={handleAddClick} style={s.addBtn}>+ Track</button>}
        </div>
        {picking && (
          <div style={s.pickerWrap} onClick={(e) => e.stopPropagation()}>
            <StatusPicker onPick={handlePick} onClose={() => setPicking(false)} />
          </div>
        )}
      </div>
      <p style={s.cardTitle}>{result.title}</p>
      <p style={s.cardMeta}>
        {result.mediaCategory === "anime"
          ? result.type?.toUpperCase()
          : result.type?.charAt(0)?.toUpperCase() + result.type?.slice(1)}
        {result.totalProgress
          ? ` · ${result.mediaCategory === "anime" ? result.totalProgress + " ep" : result.totalProgress + " ch"}`
          : ""}
      </p>
    </div>
  );
}

// ── Category definitions ──────────────────────────────────────────────────────
const BROWSE_CATS = [
  { key: "all",    label: "🔥 Trending" },
  { key: "manga",  label: "📖 Manga"    },
  { key: "manhwa", label: "🇰🇷 Manhwa"  },
  { key: "anime",  label: "📺 Anime"    },
];

// ── Main modal ────────────────────────────────────────────────────────────────
export default function DiscoverModal({ onClose, onAdd, existingTitles }) {
  // Tabs
  const [activeTab, setActiveTab] = useState("browse"); // "browse" | "search" | "seasonal"

  // Browse state
  const [browseCat, setBrowseCat]         = useState("all");
  const [browseGenreId, setBrowseGenreId] = useState(null);
  const [browseResults, setBrowseResults] = useState([]);
  const [isLoadingBrowse, setIsLoadingBrowse]   = useState(false);
  const [browseLoadingMore, setBrowseLoadingMore] = useState(false);
  const [browsePage, setBrowsePage]       = useState(1);
  const [browseHasMore, setBrowseHasMore] = useState(false);

  // Search state
  const [query, setQuery]               = useState("");
  const [searchCat, setSearchCat]       = useState("comics");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching]   = useState(false);
  const [searched, setSearched]         = useState(false);

  // Seasonal state
  const [seasonalResults, setSeasonalResults] = useState([]);
  const [seasonalLoaded, setSeasonalLoaded]   = useState(false);
  const [isLoadingSeasonal, setIsLoadingSeasonal] = useState(false);

  const [addedIds, setAddedIds] = useState(new Set());

  // ── Browse loader ───────────────────────────────────────────────────────────
  const loadBrowse = useCallback(async (cat, genreId, page, append = false) => {
    if (page === 1) setIsLoadingBrowse(true);
    else setBrowseLoadingMore(true);

    try {
      let results = [];
      let hasMore = false;

      if (cat === "all") {
        const [mRes, aRes] = await Promise.all([
          fetchWithRetry(`https://api.jikan.moe/v4/top/manga?limit=20&page=${page}&sfw=true`),
          fetchWithRetry(`https://api.jikan.moe/v4/top/anime?limit=20&page=${page}&sfw=true`),
        ]);
        const [mJson, aJson] = await Promise.all([mRes.json(), aRes.json()]);
        const manga = (mJson?.data || []).map((r) => ({ ...mapJikanManga(r), rank: r.rank }));
        const anime = (aJson?.data || []).map((r) => ({ ...mapJikanAnime(r), rank: r.rank }));
        // Interleave manga and anime so grid looks mixed
        const interleaved = [];
        const maxLen = Math.max(manga.length, anime.length);
        for (let i = 0; i < maxLen; i++) {
          if (manga[i]) interleaved.push(manga[i]);
          if (anime[i]) interleaved.push(anime[i]);
        }
        results = interleaved;
        hasMore = (mJson?.pagination?.has_next_page || aJson?.pagination?.has_next_page) ?? false;

      } else if (cat === "manhwa") {
        const offset = (page - 1) * 24;
        const res = await fetchWithRetry(
          `https://api.mangadex.org/manga?originalLanguage[]=ko&limit=24&offset=${offset}` +
          `&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive` +
          `&order[followedCount]=desc`
        );
        const json = await res.json();
        results = (json?.data || []).map(mapMangaDexResult);
        hasMore = json?.total > offset + results.length;

      } else if (cat === "manga") {
        const url = genreId
          ? `https://api.jikan.moe/v4/manga?genres=${genreId}&order_by=popularity&limit=24&page=${page}&sfw=true`
          : `https://api.jikan.moe/v4/top/manga?limit=24&page=${page}&sfw=true`;
        const res = await fetchWithRetry(url);
        const json = await res.json();
        results = (json?.data || []).map((r) => ({ ...mapJikanManga(r), rank: r.rank }));
        hasMore = json?.pagination?.has_next_page ?? false;

      } else if (cat === "anime") {
        const url = genreId
          ? `https://api.jikan.moe/v4/anime?genres=${genreId}&order_by=popularity&limit=24&page=${page}&sfw=true`
          : `https://api.jikan.moe/v4/top/anime?limit=24&page=${page}&sfw=true`;
        const res = await fetchWithRetry(url);
        const json = await res.json();
        results = (json?.data || []).map((r) => ({ ...mapJikanAnime(r), rank: r.rank }));
        hasMore = json?.pagination?.has_next_page ?? false;
      }

      setBrowseResults((prev) => append ? [...prev, ...results] : results);
      setBrowseHasMore(hasMore);
      setBrowsePage(page);
    } catch {
      if (!append) setBrowseResults([]);
    } finally {
      setIsLoadingBrowse(false);
      setBrowseLoadingMore(false);
    }
  }, []);

  // Reload when category or genre changes
  useEffect(() => {
    setBrowseResults([]);
    loadBrowse(browseCat, browseGenreId, 1, false);
  }, [browseCat, browseGenreId]);

  // Load seasonal when tab is selected
  useEffect(() => {
    if (activeTab === "seasonal" && !seasonalLoaded) loadSeasonal();
  }, [activeTab]);

  async function loadSeasonal() {
    setIsLoadingSeasonal(true);
    try {
      const res = await fetchWithRetry("https://api.jikan.moe/v4/seasons/now?limit=24&sfw=true");
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
        const res = await fetchWithRetry(
          `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=24` +
          `&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`
        );
        if (res.ok) {
          const json = await res.json();
          const results = (json?.data || []).map(mapMangaDexResult);
          if (results.length) { setSearchResults(results); return; }
        }
        const fallback = await fetchWithRetry(
          `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=24&sfw=true`
        );
        const fallbackJson = await fallback.json();
        setSearchResults((fallbackJson?.data || []).map(mapJikanManga));
      } else {
        const res = await fetchWithRetry(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=24&sfw=true`
        );
        const json = await res.json();
        setSearchResults((json?.data || []).map(mapJikanAnime));
      }
    } catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
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

  function selectCat(cat) {
    setBrowseCat(cat);
    setBrowseGenreId(null); // reset genre when switching category
  }
  function selectGenre(id) {
    setBrowseGenreId((prev) => (prev === id ? null : id)); // toggle
  }

  const activeResults =
    activeTab === "browse"   ? browseResults :
    activeTab === "search"   ? searchResults :
    seasonalResults;

  const isLoading =
    activeTab === "browse"   ? isLoadingBrowse :
    activeTab === "search"   ? isSearching :
    isLoadingSeasonal;

  const showGenres = activeTab === "browse" && (browseCat === "manga" || browseCat === "anime");

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} className="pv-modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <h2 style={s.heading}>Discover</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Main tabs */}
        <div style={s.tabRow}>
          {[
            { key: "browse",   label: "Browse"   },
            { key: "search",   label: "Search"   },
            { key: "seasonal", label: "Seasonal" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ ...s.tab, ...(activeTab === tab.key ? s.tabActive : {}) }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Browse controls ─────────────────────────────────────────────── */}
        {activeTab === "browse" && (
          <>
            {/* Category strip */}
            <div style={s.catStrip}>
              {BROWSE_CATS.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => selectCat(cat.key)}
                  style={{ ...s.catBtn, ...(browseCat === cat.key ? s.catBtnActive : {}) }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Genre chips — only for manga/anime */}
            {showGenres && (
              <div style={s.genreStrip}>
                {GENRES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => selectGenre(g.id)}
                    style={{ ...s.genreBtn, ...(browseGenreId === g.id ? s.genreBtnActive : {}) }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Search controls ──────────────────────────────────────────────── */}
        {activeTab === "search" && (
          <>
            <div style={s.filterRow}>
              {[["comics", "Manga / Manhwa"], ["anime", "Anime"]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setSearchCat(key); setSearchResults([]); setSearched(false); }}
                  style={{ ...s.catBtn, ...(searchCat === key ? s.catBtnActive : {}) }}
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

        {/* ── Skeleton ──────────────────────────────────────────────────────── */}
        {isLoading && (
          <div style={s.grid}>
            {[...Array(12)].map((_, i) => <div key={i} style={s.skeleton} />)}
          </div>
        )}

        {/* ── Results grid ─────────────────────────────────────────────────── */}
        {!isLoading && activeResults.length > 0 && (
          <>
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

            {/* Load More — only for browse tab */}
            {activeTab === "browse" && browseHasMore && (
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <button
                  onClick={() => loadBrowse(browseCat, browseGenreId, browsePage + 1, true)}
                  disabled={browseLoadingMore}
                  style={{ ...s.loadMoreBtn, opacity: browseLoadingMore ? 0.6 : 1 }}
                >
                  {browseLoadingMore ? "Loading…" : "Load More"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state for search before typing */}
        {activeTab === "search" && !searched && !isSearching && (
          <div style={s.searchEmpty}>
            <p style={s.searchEmptyIcon}>🔍</p>
            <p style={s.searchEmptyText}>Search across MangaDex and MyAnimeList</p>
          </div>
        )}

        <p style={s.footer}>
          Data from MangaDex & MyAnimeList · Click + Track to add to your library
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
    width: "100%", maxWidth: 900,
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
  // Category strip (Trending / Manga / Manhwa / Anime)
  catStrip: {
    display: "flex", gap: 8, flexWrap: "wrap",
  },
  catBtn: {
    padding: "9px 16px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#cbd5e1", cursor: "pointer",
    fontWeight: 700, fontSize: "0.88rem",
    whiteSpace: "nowrap",
  },
  catBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff", border: "none",
    boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
  },
  // Genre chips
  genreStrip: {
    display: "flex", gap: 7, flexWrap: "wrap",
  },
  genreBtn: {
    padding: "7px 13px", borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.04)",
    color: "#94a3b8", cursor: "pointer",
    fontWeight: 600, fontSize: "0.82rem",
    whiteSpace: "nowrap",
  },
  genreBtnActive: {
    background: "rgba(99,102,241,0.2)",
    border: "1px solid rgba(99,102,241,0.4)",
    color: "#a5b4fc",
  },
  // Search
  filterRow: { display: "flex", gap: 8 },
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
  searchEmpty: { textAlign: "center", padding: "40px 0" },
  searchEmptyIcon: { fontSize: "2.5rem", margin: "0 0 8px" },
  searchEmptyText: { margin: 0, color: "#475569", fontSize: "0.9rem", fontWeight: 600 },
  // Grid
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 14,
  },
  skeleton: {
    aspectRatio: "2 / 3", borderRadius: 14,
    background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.07))",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  // Cover card
  card: { display: "flex", flexDirection: "column", gap: 6 },
  coverWrap: {
    width: "100%", aspectRatio: "2 / 3",
    borderRadius: 14, overflow: "hidden",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.07)",
    position: "relative", cursor: "pointer",
  },
  coverImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noCover: {
    width: "100%", height: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
  },
  noCoverInitial: { fontSize: "2rem", fontWeight: 900, color: "rgba(99,102,241,0.4)" },
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
    background: "rgba(34,197,94,0.2)", color: "#4ade80",
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
  // Status picker
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
  // Load more
  loadMoreBtn: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#cbd5e1", borderRadius: 12,
    padding: "12px 32px", fontWeight: 700,
    fontSize: "0.9rem", cursor: "pointer",
  },
  footer: {
    margin: 0, textAlign: "center",
    color: "#334155", fontSize: "0.75rem",
  },
};
