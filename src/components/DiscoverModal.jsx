import React, { useState, useEffect } from "react";
import { normalizeTitle } from "../lib/seriesUtils";

function mapMangaResult(result) {
  const rawType = (result.type || "").toLowerCase();
  const typeMap = { manhwa: "manhwa", manhua: "manhua", manga: "manga" };
  return {
    mediaCategory: "comics",
    title: result.title_english || result.title || "Untitled",
    image: result.images?.jpg?.image_url || "",
    type: typeMap[rawType] || "manga",
    status: "notRead",
    summary: result.synopsis || "",
    altTitles: [result.title, result.title_japanese]
      .filter(Boolean)
      .filter((t) => t !== (result.title_english || result.title)),
    tags: [],
    needsReview: false,
    currentProgress: 0,
    totalProgress: result.chapters && result.chapters > 0 ? result.chapters : null,
    rating: null,
  };
}

function mapAnimeResult(result) {
  const rawType = (result.type || "").toLowerCase();
  const typeMap = { tv: "tv", movie: "movie", ova: "ova", ona: "ona" };
  return {
    mediaCategory: "anime",
    title: result.title_english || result.title || "Untitled",
    image: result.images?.jpg?.image_url || "",
    type: typeMap[rawType] || "tv",
    status: "notRead",
    summary: result.synopsis || "",
    altTitles: [result.title, result.title_japanese]
      .filter(Boolean)
      .filter((t) => t !== (result.title_english || result.title)),
    tags: [],
    needsReview: false,
    currentProgress: 0,
    totalProgress: result.episodes && result.episodes > 0 ? result.episodes : null,
    rating: null,
  };
}

function mapMangaDexResult(manga) {
  const { id, attributes, relationships } = manga;
  const coverRel = (relationships || []).find((r) => r.type === "cover_art");
  const fileName = coverRel?.attributes?.fileName;
  const image = fileName ? `https://uploads.mangadex.org/covers/${id}/${fileName}.256.jpg` : "";
  const title = attributes?.title?.en || Object.values(attributes?.title || {})[0] || "Untitled";
  const tags = (attributes?.tags || [])
    .map((t) => t.attributes?.name?.en).filter(Boolean).slice(0, 5);
  const altTitleObjs = attributes?.altTitles || [];
  const altTitles = altTitleObjs.flatMap((obj) => Object.values(obj)).filter(Boolean).slice(0, 3);
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

const TABS = [
  { key: "search",   label: "Search"     },
  { key: "top",      label: "Top Charts" },
  { key: "seasonal", label: "Seasonal"   },
];

export default function DiscoverModal({
  onClose,
  onAdd,
  existingTitles,
  defaultMediaCategory = "comics",
}) {
  const [activeTab, setActiveTab] = useState("search");
  const [searchCat, setSearchCat] = useState(defaultMediaCategory);
  const [searchSource, setSearchSource] = useState("mangadex"); // "mangadex" | "jikan"

  // Search state
  const [query, setQuery]         = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [searched, setSearched]           = useState(false);

  // Top / Seasonal state
  const [topResults, setTopResults]       = useState([]);
  const [topFilter, setTopFilter]         = useState("all"); // "all" | "comics" | "anime"
  const [seasonalResults, setSeasonalResults] = useState([]);
  const [isLoadingTop, setIsLoadingTop]   = useState(false);
  const [isLoadingSeasonal, setIsLoadingSeasonal] = useState(false);
  const [topLoaded, setTopLoaded]         = useState(false);
  const [seasonalLoaded, setSeasonalLoaded] = useState(false);

  // Track adds this session
  const [addedIds, setAddedIds] = useState(new Set());

  // Auto-load top charts and seasonal when those tabs are first opened
  useEffect(() => {
    if (activeTab === "top" && !topLoaded) loadTop();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "seasonal" && !seasonalLoaded) loadSeasonal();
  }, [activeTab]);

  async function loadTop() {
    setIsLoadingTop(true);
    try {
      const [mangaRes, animeRes] = await Promise.all([
        fetch("https://api.jikan.moe/v4/top/manga?limit=12&sfw=true"),
        fetch("https://api.jikan.moe/v4/top/anime?limit=12&sfw=true"),
      ]);
      const mangaJson = await mangaRes.json();
      const animeJson = await animeRes.json();
      const manga = (mangaJson?.data || []).map((r) => ({ malId: r.mal_id, rank: r.rank, ...mapMangaResult(r) }));
      const anime = (animeJson?.data || []).map((r) => ({ malId: r.mal_id, rank: r.rank, ...mapAnimeResult(r) }));
      setTopResults([...manga, ...anime]);
      setTopLoaded(true);
    } catch {
      setTopResults([]);
    } finally {
      setIsLoadingTop(false);
    }
  }

  async function loadSeasonal() {
    setIsLoadingSeasonal(true);
    try {
      const res = await fetch("https://api.jikan.moe/v4/seasons/now?limit=20&sfw=true");
      const json = await res.json();
      const items = (json?.data || []).map((r) => ({ malId: r.mal_id, ...mapAnimeResult(r) }));
      setSeasonalResults(items);
      setSeasonalLoaded(true);
    } catch {
      setSeasonalResults([]);
    } finally {
      setIsLoadingSeasonal(false);
    }
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearched(true);
    try {
      if (searchCat === "comics" && searchSource === "mangadex") {
        await searchMangaDex();
      } else {
        await searchJikan();
      }
    } finally {
      setIsSearching(false);
    }
  }

  async function searchJikan() {
    try {
      const endpoint =
        searchCat === "anime"
          ? `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12&sfw=true`
          : `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=12&sfw=true`;
      const res = await fetch(endpoint);
      const json = await res.json();
      const raw = Array.isArray(json?.data) ? json.data : [];
      setSearchResults(raw.map((r) => ({
        malId: r.mal_id,
        ...(searchCat === "anime" ? mapAnimeResult(r) : mapMangaResult(r)),
      })));
    } catch {
      setSearchResults([]);
    }
  }

  async function searchMangaDex() {
    try {
      const res = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=12` +
        `&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive`
      );
      const json = await res.json();
      const raw = Array.isArray(json?.data) ? json.data : [];
      setSearchResults(raw.map((manga) => mapMangaDexResult(manga)));
    } catch {
      setSearchResults([]);
    }
  }

  function isInLibrary(result) {
    const check = (t) => t && existingTitles.has(normalizeTitle(t));
    return check(result.title) || result.altTitles.some((a) => check(a));
  }

  function handleAdd(result) {
    const { malId, mdId, rank, ...seriesData } = result;
    onAdd(seriesData);
    const trackId = malId ?? mdId ?? result.title;
    setAddedIds((prev) => new Set([...prev, trackId]));
  }

  function isAdded(result) {
    const trackId = result.malId ?? result.mdId ?? result.title;
    return isInLibrary(result) || addedIds.has(trackId);
  }

  function resultKey(result) {
    return result.malId ?? result.mdId ?? result.title;
  }

  const filteredTopResults = topFilter === "all"
    ? topResults
    : topResults.filter((r) => r.mediaCategory === topFilter);

  const activeResults =
    activeTab === "search"   ? searchResults :
    activeTab === "top"      ? filteredTopResults :
    seasonalResults;

  const isLoading =
    activeTab === "search"   ? isSearching :
    activeTab === "top"      ? isLoadingTop :
    isLoadingSeasonal;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} className="pv-modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.heading}>Discover</h2>
          <button onClick={onClose} style={s.closeBtn} aria-label="Close">✕</button>
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

        {/* Search-specific controls */}
        {activeTab === "search" && (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={s.catRow}>
                {["comics", "anime"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSearchCat(cat); setSearchResults([]); setSearched(false); }}
                    style={{ ...s.catBtn, ...(searchCat === cat ? s.catBtnActive : {}) }}
                  >
                    {cat === "anime" ? "Anime" : "Comics"}
                  </button>
                ))}
              </div>
              {searchCat === "comics" && (
                <div style={s.catRow}>
                  {[["mangadex", "MangaDex"], ["jikan", "MAL"]].map(([src, label]) => (
                    <button
                      key={src}
                      onClick={() => { setSearchSource(src); setSearchResults([]); setSearched(false); }}
                      style={{ ...s.catBtn, ...(searchSource === src ? s.catBtnActive : {}) }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
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
                style={{
                  ...s.searchBtn,
                  opacity: isSearching || !query.trim() ? 0.6 : 1,
                  cursor: isSearching || !query.trim() ? "default" : "pointer",
                }}
              >
                {isSearching ? "Searching…" : "Search"}
              </button>
            </div>
            {searched && !isSearching && searchResults.length === 0 && (
              <p style={s.emptyMsg}>No results found. Try a different search.</p>
            )}
          </>
        )}

        {/* Top Charts filter */}
        {activeTab === "top" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={s.catRow}>
              {[["all", "All"], ["comics", "Manga"], ["anime", "Anime"]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTopFilter(key)}
                  style={{ ...s.catBtn, ...(topFilter === key ? s.catBtnActive : {}), padding: "7px 14px", fontSize: "0.85rem" }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p style={{ ...s.tabDesc, margin: 0 }}>Top-ranked from MyAnimeList</p>
          </div>
        )}
        {activeTab === "seasonal" && (
          <p style={s.tabDesc}>
            Currently airing anime this season
          </p>
        )}

        {/* Loading */}
        {isLoading && (
          <p style={s.emptyMsg}>Loading…</p>
        )}

        {/* Results */}
        <div style={s.resultList}>
          {activeResults.map((result) => {
            const added = isAdded(result);
            return (
              <div key={resultKey(result)} style={s.resultItem}>
                <div style={s.resultCoverWrap}>
                  {result.image ? (
                    <img
                      src={result.image}
                      alt={result.title}
                      style={s.resultCover}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div style={s.resultNoCover}>No Cover</div>
                  )}
                </div>

                <div style={s.resultInfo}>
                  <p style={s.resultTitle}>
                    {result.rank ? <span style={s.rankBadge}>#{result.rank}</span> : null}
                    {result.title}
                  </p>
                  <p style={s.resultMeta}>
                    {result.mediaCategory === "anime" ? "Anime" : "Comics"} · {result.type?.toUpperCase()}
                    {result.totalProgress ? ` · ${result.mediaCategory === "anime" ? result.totalProgress + " ep" : result.totalProgress + " ch"}` : ""}
                  </p>
                  {result.summary ? (
                    <p style={s.resultSynopsis}>
                      {result.summary.length > 160
                        ? result.summary.slice(0, 160) + "…"
                        : result.summary}
                    </p>
                  ) : null}
                </div>

                <div style={s.resultAction}>
                  {added ? (
                    <span style={s.addedBadge}>✓ Added</span>
                  ) : (
                    <button onClick={() => handleAdd(result)} style={s.addBtn}>
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p style={s.footer}>
          {activeTab === "search" && searchSource === "mangadex" && searchCat === "comics"
            ? "Results from MangaDex"
            : "Results from MyAnimeList via Jikan API"}
        </p>
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
    maxWidth: 720,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26,
    padding: 24,
    boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
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
  tabRow: {
    display: "flex",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    background: "rgba(255,255,255,0.04)",
    color: "#94a3b8",
    border: "none",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  tabActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
  },
  catRow: {
    display: "flex",
    gap: 8,
  },
  catBtn: {
    padding: "9px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#dbe4f0",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.9rem",
  },
  catBtnActive: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
  },
  searchRow: {
    display: "flex",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    boxSizing: "border-box",
    borderRadius: 14,
    outline: "none",
    fontSize: "1rem",
    padding: "12px 16px",
    color: "#f8fafc",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "none",
  },
  searchBtn: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "12px 20px",
    fontWeight: 800,
    whiteSpace: "nowrap",
    boxShadow: "0 8px 20px rgba(99,102,241,0.22)",
    cursor: "pointer",
  },
  tabDesc: {
    margin: 0,
    color: "#64748b",
    fontSize: "0.88rem",
  },
  emptyMsg: {
    color: "#94a3b8",
    textAlign: "center",
    margin: 0,
    padding: "12px 0",
  },
  resultList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  resultItem: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: 12,
  },
  resultCoverWrap: {
    width: 58,
    aspectRatio: "2 / 3",
    borderRadius: 8,
    overflow: "hidden",
    background: "#1e293b",
    flexShrink: 0,
  },
  resultCover: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  resultNoCover: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "0.65rem",
    fontWeight: 700,
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultTitle: {
    margin: "0 0 4px 0",
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  rankBadge: {
    flexShrink: 0,
    background: "rgba(245,158,11,0.2)",
    color: "#fbbf24",
    borderRadius: 6,
    padding: "1px 6px",
    fontSize: "0.72rem",
    fontWeight: 800,
  },
  resultMeta: {
    margin: "0 0 5px 0",
    fontSize: "0.76rem",
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  resultSynopsis: {
    margin: 0,
    fontSize: "0.82rem",
    color: "#94a3b8",
    lineHeight: 1.5,
  },
  resultAction: {
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-start",
    paddingTop: 2,
  },
  addBtn: {
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "8px 14px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
    boxShadow: "0 6px 16px rgba(99,102,241,0.25)",
  },
  addedBadge: {
    background: "rgba(34,197,94,0.15)",
    color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.25)",
    borderRadius: 10,
    padding: "8px 12px",
    fontWeight: 800,
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  },
  footer: {
    margin: 0,
    textAlign: "center",
    color: "#475569",
    fontSize: "0.78rem",
  },
};
