import React, { useMemo } from "react";
import { ACTIVITY_KEY } from "./SettingsModal";

export default function Dashboard({ series, profile, onOpenSeries, onDiscover, onViewLibrary }) {
  const activityLog = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]"); } catch { return []; }
  }, [series]); // refresh when series changes (proxy for user action)

  const streak = useMemo(() => {
    if (!activityLog.length) return 0;
    const today = new Date().toISOString().split("T")[0];
    const days = [...new Set(activityLog.map((e) => e.date))].sort().reverse();
    let count = 0, check = today;
    for (const day of days) {
      if (day === check) {
        count++;
        const d = new Date(check + "T12:00:00");
        d.setDate(d.getDate() - 1);
        check = d.toISOString().split("T")[0];
      } else if (day < check) break;
    }
    return count;
  }, [activityLog]);

  // Recent activity IDs (most recently pressed +1, for sorting Continue Reading)
  const recentIds = useMemo(() => {
    const seen = new Set();
    const ids = [];
    for (let i = activityLog.length - 1; i >= 0; i--) {
      const id = activityLog[i].seriesId;
      if (!seen.has(id)) { seen.add(id); ids.push(id); }
    }
    return ids;
  }, [activityLog]);

  const continueReading = useMemo(() => {
    const reading = series.filter((s) => s.status === "reading");
    const byActivity = recentIds.map((id) => reading.find((s) => s.id === id)).filter(Boolean);
    const rest = reading.filter((s) => !recentIds.includes(s.id));
    return [...byActivity, ...rest].slice(0, 10);
  }, [series, recentIds]);

  const upNext = useMemo(() =>
    series.filter((s) => s.status === "readNext").slice(0, 8),
    [series]);

  const recentlyAdded = useMemo(() =>
    [...series].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8),
    [series]);

  const totalReading  = series.filter((s) => s.status === "reading").length;
  const totalFinished = series.filter((s) => s.status === "finished").length;
  const greeting = profile?.username ? `@${profile.username}` : null;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          {greeting && <p style={s.greeting}>Welcome back, {greeting}</p>}
          <h1 style={s.title}>Your Library</h1>
        </div>
        <div style={s.pills}>
          {streak > 0 && (
            <div style={s.streakPill}>🔥 {streak} day{streak !== 1 ? "s" : ""}</div>
          )}
          <div style={s.pill}>{totalReading} in progress</div>
          <div style={s.pill}>{totalFinished} finished</div>
        </div>
      </div>

      {/* Continue Reading */}
      {continueReading.length > 0 && (
        <Shelf title="Continue Reading" onSeeAll={() => onViewLibrary("reading")}>
          {continueReading.map((item) => (
            <CoverCard key={item.id} item={item} onClick={() => onOpenSeries(item)} showProgress />
          ))}
        </Shelf>
      )}

      {/* Up Next */}
      {upNext.length > 0 && (
        <Shelf title="Up Next" onSeeAll={() => onViewLibrary("readNext")}>
          {upNext.map((item) => (
            <CoverCard key={item.id} item={item} onClick={() => onOpenSeries(item)} />
          ))}
        </Shelf>
      )}

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <Shelf title="Recently Added" onSeeAll={() => onViewLibrary("all")}>
          {recentlyAdded.map((item) => (
            <CoverCard key={item.id} item={item} onClick={() => onOpenSeries(item)} />
          ))}
        </Shelf>
      )}

      {/* Empty state */}
      {series.length === 0 && (
        <div style={s.empty}>
          <p style={s.emptyIcon}>📚</p>
          <p style={s.emptyTitle}>Your library is empty</p>
          <p style={s.emptyText}>Add series manually or discover something new.</p>
          <button onClick={onDiscover} style={s.discoverBtn}>Discover Series</button>
        </div>
      )}
    </div>
  );
}

function Shelf({ title, onSeeAll, children }) {
  return (
    <div style={s.shelf}>
      <div style={s.shelfHeader}>
        <p style={s.shelfTitle}>{title}</p>
        <button onClick={onSeeAll} style={s.seeAll}>See all →</button>
      </div>
      <div style={s.scroll}>{children}</div>
    </div>
  );
}

function CoverCard({ item, onClick, showProgress }) {
  const isAnime = item.mediaCategory === "anime";
  return (
    <button onClick={onClick} style={s.card}>
      <div style={s.coverWrap}>
        {item.image ? (
          <img src={item.image} alt={item.title} style={s.cover}
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div style={s.noCover}>{(item.title || "?")[0].toUpperCase()}</div>
        )}
        {item.rating && <div style={s.ratingBadge}>★ {item.rating}</div>}
        {isAnime && <div style={s.animeBadge}>Anime</div>}
      </div>
      <p style={s.cardTitle}>{item.title}</p>
      {showProgress && item.currentProgress > 0 && (
        <p style={s.cardProgress}>
          {isAnime ? "Ep" : "Ch"} {item.currentProgress}
          {item.totalProgress ? `/${item.totalProgress}` : ""}
        </p>
      )}
    </button>
  );
}

const s = {
  page: {
    padding: "24px 24px 48px",
    display: "flex",
    flexDirection: "column",
    gap: 32,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 14,
  },
  greeting: {
    margin: "0 0 4px",
    color: "#64748b",
    fontSize: "0.88rem",
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 900,
    letterSpacing: "-0.04em",
    color: "#ffffff",
  },
  pills: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  streakPill: {
    background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(239,68,68,0.15))",
    border: "1px solid rgba(245,158,11,0.3)",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: "0.88rem",
    fontWeight: 800,
    color: "#fbbf24",
    whiteSpace: "nowrap",
  },
  pill: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "#94a3b8",
    whiteSpace: "nowrap",
  },
  shelf: { display: "flex", flexDirection: "column", gap: 12 },
  shelfHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shelfTitle: {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 800,
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
  },
  seeAll: {
    background: "transparent",
    border: "none",
    color: "#6366f1",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
    padding: "4px 0",
  },
  scroll: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 6,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  card: {
    flexShrink: 0,
    width: 120,
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  coverWrap: {
    width: 120,
    height: 170,
    borderRadius: 14,
    overflow: "hidden",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    position: "relative",
    flexShrink: 0,
  },
  cover: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noCover: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    fontWeight: 900,
    color: "#475569",
    background: "linear-gradient(135deg, #1e293b, #0f172a)",
  },
  ratingBadge: {
    position: "absolute",
    bottom: 6, right: 6,
    background: "rgba(245,158,11,0.95)",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 6px",
    fontSize: "0.64rem",
    fontWeight: 800,
  },
  animeBadge: {
    position: "absolute",
    top: 6, left: 6,
    background: "rgba(14,165,233,0.9)",
    color: "#fff",
    borderRadius: 999,
    padding: "2px 6px",
    fontSize: "0.62rem",
    fontWeight: 800,
  },
  cardTitle: {
    margin: 0,
    fontSize: "0.82rem",
    fontWeight: 700,
    color: "#dfe8f4",
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardProgress: {
    margin: 0,
    fontSize: "0.72rem",
    color: "#475569",
    fontWeight: 700,
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: { fontSize: "3rem", margin: 0 },
  emptyTitle: {
    margin: 0,
    fontSize: "1.1rem",
    fontWeight: 800,
    color: "#f1f5f9",
  },
  emptyText: { margin: 0, color: "#475569", fontSize: "0.9rem" },
  discoverBtn: {
    marginTop: 8,
    background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "12px 22px",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "0.95rem",
  },
};
