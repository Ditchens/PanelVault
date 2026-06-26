import React, { useMemo, useState } from "react";
import { ACTIVITY_KEY } from "./SettingsModal";

const GOAL_KEY = "panelvault_weekly_goal";

export default function Dashboard({ series, profile, onOpenSeries, onDiscover, onImport, onViewLibrary, onRefreshCovers, isFetchingCovers, missingCoverCount }) {
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

  const recentlyFinished = useMemo(() =>
    [...series]
      .filter((s) => s.status === "finished")
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 8),
    [series]);

  const weekProgress = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    return activityLog
      .filter((e) => e.date >= cutoff)
      .reduce((sum, e) => sum + (e.delta || 1), 0);
  }, [activityLog]);

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

      {/* Missing covers banner */}
      {missingCoverCount > 0 && onRefreshCovers && (
        <button
          onClick={onRefreshCovers}
          disabled={isFetchingCovers}
          style={s.coverBanner}
        >
          <span style={{ fontSize: "1.3rem" }}>🖼</span>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#f1f5f9" }}>
              {isFetchingCovers ? "Fetching covers…" : `${missingCoverCount} series missing covers`}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 2 }}>
              {isFetchingCovers ? "This may take a minute" : "Tap to fetch automatically"}
            </div>
          </div>
          {!isFetchingCovers && <span style={{ color: "#818cf8", fontSize: "1rem" }}>→</span>}
        </button>
      )}

      {/* Weekly Goal */}
      <GoalCard weekProgress={weekProgress} />

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

      {/* Recently Finished */}
      {recentlyFinished.length > 0 && (
        <Shelf title="Finished" onSeeAll={() => onViewLibrary("finished")}>
          {recentlyFinished.map((item) => (
            <CoverCard key={item.id} item={item} onClick={() => onOpenSeries(item)} />
          ))}
        </Shelf>
      )}

      {/* Empty state */}
      {series.length === 0 && (
        <div style={s.empty}>
          <p style={s.emptyIcon}>📚</p>
          <p style={s.emptyTitle}>Your library is empty</p>
          <p style={s.emptyText}>Start building your collection — import, discover, or add manually.</p>
          <div style={s.emptyActions}>
            {onImport && (
              <button onClick={onImport} style={s.emptyActionBtn}>
                <span style={s.emptyActionIcon}>📥</span>
                <span style={s.emptyActionLabel}>Import from MAL</span>
                <span style={s.emptyActionDesc}>Sync your existing library</span>
              </button>
            )}
            <button onClick={onDiscover} style={s.emptyActionBtn}>
              <span style={s.emptyActionIcon}>🔍</span>
              <span style={s.emptyActionLabel}>Discover Series</span>
              <span style={s.emptyActionDesc}>Browse top charts & trending</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({ weekProgress }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [goal, setGoal] = useState(() => {
    try { return parseInt(localStorage.getItem(GOAL_KEY) || "0") || 0; } catch { return 0; }
  });

  function saveGoal() {
    const n = parseInt(input);
    if (n > 0) {
      localStorage.setItem(GOAL_KEY, String(n));
      setGoal(n);
    }
    setEditing(false);
    setInput("");
  }

  if (editing) {
    return (
      <div style={s.goalCard}>
        <span style={s.goalLabel}>Weekly chapters / episodes target</span>
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <input
            type="number"
            min="1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveGoal(); if (e.key === "Escape") setEditing(false); }}
            placeholder="e.g. 30"
            autoFocus
            style={s.goalInput}
          />
          <button onClick={saveGoal} style={s.goalSaveBtn}>Set</button>
          <button onClick={() => setEditing(false)} style={s.goalCancelBtn}>Cancel</button>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <button onClick={() => { setInput(""); setEditing(true); }} style={s.goalEmpty}>
        Set a weekly reading goal →
      </button>
    );
  }

  const pct = Math.min(100, Math.round((weekProgress / goal) * 100));
  const done = weekProgress >= goal;

  return (
    <div style={s.goalCard}>
      <div style={s.goalTop}>
        <span style={s.goalLabel}>Weekly Goal</span>
        <button onClick={() => { setInput(String(goal)); setEditing(true); }} style={s.goalEditBtn}>
          Edit
        </button>
      </div>
      <div style={s.goalNumbers}>
        <span style={{ ...s.goalProgressNum, color: done ? "#4ade80" : "#f8fafc" }}>
          {weekProgress}
        </span>
        <span style={s.goalTotalNum}> / {goal}</span>
        <span style={s.goalUnit}> this week</span>
      </div>
      <div style={s.goalBarTrack}>
        <div style={{
          ...s.goalBarFill,
          width: `${pct}%`,
          background: done
            ? "linear-gradient(90deg, #22c55e, #4ade80)"
            : "linear-gradient(90deg, #6366f1, #8b5cf6)",
        }} />
      </div>
      {done && <p style={s.goalAchieved}>Goal reached!</p>}
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
    <button onClick={onClick} style={s.card} className="pv-shelf-card">
      <div style={s.coverWrap}>
        {item.image ? (
          <img src={item.image} alt={item.title} style={s.cover} loading="lazy"
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
    padding: "20px 16px 48px",
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
    paddingBottom: 8,
    paddingRight: 16,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },
  card: {
    flexShrink: 0,
    width: 140,
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
    width: 140,
    height: 198,
    borderRadius: 14,
    overflow: "hidden",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    position: "relative",
    flexShrink: 0,
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
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
  emptyText: { margin: "0 0 20px", color: "#475569", fontSize: "0.9rem" },
  emptyActions: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  emptyActionBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 18,
    padding: "18px 22px",
    cursor: "pointer",
    minWidth: 140,
    textAlign: "center",
  },
  emptyActionIcon: { fontSize: "1.5rem" },
  emptyActionLabel: {
    color: "#f1f5f9",
    fontWeight: 800,
    fontSize: "0.9rem",
  },
  emptyActionDesc: {
    color: "#64748b",
    fontSize: "0.78rem",
    fontWeight: 500,
  },
  coverBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 16,
    padding: "14px 16px",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
  goalEmpty: {
    background: "rgba(99,102,241,0.08)",
    border: "1px dashed rgba(99,102,241,0.3)",
    borderRadius: 16,
    padding: "14px 18px",
    color: "#818cf8",
    fontSize: "0.88rem",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
    maxWidth: 320,
  },
  goalCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderLeft: "3px solid rgba(99,102,241,0.6)",
    borderRadius: 18,
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxWidth: 360,
  },
  goalTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: "0.8rem",
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  goalNumbers: { display: "flex", alignItems: "baseline", gap: 0 },
  goalProgressNum: { fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.03em" },
  goalTotalNum: { fontSize: "1rem", fontWeight: 700, color: "#475569" },
  goalUnit: { fontSize: "0.8rem", color: "#475569", marginLeft: 4 },
  goalBarTrack: {
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  goalBarFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.4s ease",
  },
  goalAchieved: {
    margin: 0,
    fontSize: "0.82rem",
    fontWeight: 800,
    color: "#4ade80",
  },
  goalInput: {
    flex: 1,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "8px 12px",
    color: "#f8fafc",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  },
  goalSaveBtn: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 10,
    padding: "8px 14px",
    color: "#fff",
    fontWeight: 800,
    fontSize: "0.88rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  goalCancelBtn: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  goalEditBtn: {
    background: "transparent",
    border: "none",
    color: "#6366f1",
    fontWeight: 700,
    fontSize: "0.78rem",
    cursor: "pointer",
  },
};
