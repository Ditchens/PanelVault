import React, { useMemo } from "react";
import { STATUS_OPTIONS, COMICS_TAG_OPTIONS, ANIME_TAG_OPTIONS } from "../lib/constants";
import { formatStatusLabel, formatTypeLabel } from "../lib/seriesUtils";

export default function StatsModal({ series, activityLog = [], onClose }) {
  // Reading streak
  const streak = useMemo(() => {
    if (!activityLog.length) return 0;
    const today = new Date().toISOString().split("T")[0];
    const days = [...new Set(activityLog.map((e) => e.date))].sort().reverse();
    let count = 0;
    let check = today;
    for (const day of days) {
      if (day === check) {
        count++;
        const d = new Date(check + "T12:00:00");
        d.setDate(d.getDate() - 1);
        check = d.toISOString().split("T")[0];
      } else if (day < check) {
        break;
      }
    }
    return count;
  }, [activityLog]);

  // Last 7 days bar chart data
  const weekActivity = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0];
      const count = activityLog
        .filter((e) => e.date === date)
        .reduce((s, e) => s + (e.delta || 1), 0);
      result.push({ date, count, label: d.toLocaleDateString("en", { weekday: "short" }) });
    }
    return result;
  }, [activityLog]);

  const maxWeekDay = Math.max(...weekActivity.map((d) => d.count), 1);

  // Weekly reading pace (last 30 days)
  const readingPace = useMemo(() => {
    if (!activityLog.length) return 0;
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const progress = activityLog.filter((e) => e.date >= cutoff).reduce((s, e) => s + (e.delta || 1), 0);
    return Math.round((progress / 4.28) * 10) / 10;
  }, [activityLog]);

  // Rating histogram buckets
  const ratingHistogram = useMemo(() => {
    const buckets = [
      { label: "9–10", min: 9,   max: 10.5, count: 0, color: "#4ade80" },
      { label: "7–8",  min: 7,   max: 9,    count: 0, color: "#a3e635" },
      { label: "5–6",  min: 5,   max: 7,    count: 0, color: "#fbbf24" },
      { label: "3–4",  min: 3,   max: 5,    count: 0, color: "#fb923c" },
      { label: "1–2",  min: 0.5, max: 3,    count: 0, color: "#f87171" },
    ];
    series.forEach((item) => {
      if (item.rating == null) return;
      for (const b of buckets) {
        if (item.rating >= b.min && item.rating < b.max) { b.count++; break; }
      }
    });
    return buckets;
  }, [series]);

  // Top rated series
  const topRated = useMemo(() =>
    [...series].filter((i) => i.rating != null).sort((a, b) => b.rating - a.rating).slice(0, 5),
    [series]
  );

  const stats = useMemo(() => {
    const comics = series.filter((i) => (i.mediaCategory || "comics") === "comics");
    const anime  = series.filter((i) => i.mediaCategory === "anime");

    function breakdownByStatus(items, cat) {
      return STATUS_OPTIONS.filter((o) => o.key !== "all" && o.key !== "needsReview").map((o) => ({
        label: formatStatusLabel(o.key, cat),
        count: items.filter((i) => i.status === o.key).length,
        key: o.key,
      }));
    }

    function breakdownByType(items) {
      const typeKeys = [...new Set(items.map((i) => i.type).filter(Boolean))];
      return typeKeys
        .map((t) => ({ label: formatTypeLabel(t), count: items.filter((i) => i.type === t).length }))
        .sort((a, b) => b.count - a.count);
    }

    function breakdownByTag(items, tagList) {
      return tagList
        .map((tag) => ({ tag, count: items.filter((i) => i.tags.includes(tag)).length }))
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    const rated = series.filter((i) => i.rating != null);
    const avgRating = rated.length
      ? (rated.reduce((sum, i) => sum + i.rating, 0) / rated.length).toFixed(1)
      : null;

    const totalChapters = comics.reduce((sum, i) => sum + (i.currentProgress || 0), 0);
    const totalEpisodes = anime.reduce((sum, i) => sum + (i.currentProgress || 0), 0);

    const nowReading = comics.filter((i) => i.status === "reading").slice(0, 4);
    const nowWatching = anime.filter((i) => i.status === "reading").slice(0, 4);

    const finishedCount = series.filter((i) => i.status === "finished").length;
    const completionRate = series.length > 0 ? Math.round((finishedCount / series.length) * 100) : 0;
    const timeHours = Math.round((totalChapters * 10 + totalEpisodes * 24) / 60);

    return {
      total: series.length,
      comicsCount: comics.length,
      animeCount: anime.length,
      comicsStatus: breakdownByStatus(comics, "comics"),
      animeStatus: breakdownByStatus(anime, "anime"),
      comicsTypes: breakdownByType(comics),
      animeTypes: breakdownByType(anime),
      comicsTags: breakdownByTag(comics, COMICS_TAG_OPTIONS),
      animeTags: breakdownByTag(anime, ANIME_TAG_OPTIONS),
      avgRating,
      ratedCount: rated.length,
      totalChapters,
      totalEpisodes,
      nowReading,
      nowWatching,
      needsReview: series.filter((i) => i.needsReview).length,
      finishedCount,
      completionRate,
      timeHours,
    };
  }, [series]);

  const STATUS_COLORS = {
    reading:  "#6366f1",
    readNext: "#0ea5e9",
    notRead:  "#475569",
    dropped:  "#ef4444",
    finished: "#22c55e",
  };

  function Bar({ value, max, color }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <div style={s.barTrack}>
        <div style={{ ...s.barFill, width: `${pct}%`, background: color }} />
      </div>
    );
  }

  function StatCard({ label, value, sub }) {
    return (
      <div style={s.statCard}>
        <div style={s.statValue}>{value ?? "—"}</div>
        <div style={s.statLabel}>{label}</div>
        {sub && <div style={s.statSub}>{sub}</div>}
      </div>
    );
  }

  function Section({ title, children }) {
    return (
      <div style={s.section}>
        <p style={s.sectionTitle}>{title}</p>
        {children}
      </div>
    );
  }

  const maxHistogramCount = Math.max(...ratingHistogram.map((b) => b.count), 1);
  const anyRated = stats.ratedCount > 0;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} className="pv-modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.heading}>Library Stats</h2>
          <button onClick={onClose} style={s.closeBtn} aria-label="Close">✕</button>
        </div>

        {/* Top stats cards */}
        <div style={s.statGrid}>
          <StatCard label="Total Series"    value={stats.total} />
          <StatCard label="Comics"           value={stats.comicsCount} />
          <StatCard label="Anime"            value={stats.animeCount} />
          <StatCard
            label="Avg Rating"
            value={stats.avgRating ? `${stats.avgRating} / 10` : "—"}
            sub={stats.ratedCount > 0 ? `${stats.ratedCount} rated` : "None rated"}
          />
          <StatCard label="Chapters Read"    value={stats.totalChapters.toLocaleString()} />
          <StatCard label="Episodes Watched" value={stats.totalEpisodes.toLocaleString()} />
          <StatCard
            label="Reading Streak"
            value={`${streak}d`}
            sub={streak > 1 ? "Keep it up!" : streak === 1 ? "Started today" : "No streak yet"}
          />
          <StatCard label="Needs Review"     value={stats.needsReview} />
        </div>

        {/* Time & Pace stat cards */}
        {stats.total > 0 && (
          <div style={s.statGrid}>
            <StatCard
              label="Est. Hours"
              value={`${stats.timeHours}h`}
              sub={stats.timeHours > 24 ? `~${Math.round(stats.timeHours / 24)}d` : "time invested"}
            />
            <StatCard
              label="Weekly Pace"
              value={`${readingPace}/wk`}
              sub="last 30 days"
            />
            <StatCard
              label="Completion"
              value={`${stats.completionRate}%`}
              sub={`${stats.finishedCount} finished`}
            />
          </div>
        )}

        {/* 7-day activity chart */}
        {activityLog.length > 0 && (
          <Section title="Activity — last 7 days">
            <div style={s.weekRow}>
              {weekActivity.map((day) => (
                <div key={day.date} style={s.weekCol}>
                  <div style={s.weekBarWrap}>
                    <div
                      style={{
                        ...s.weekBar,
                        height: `${Math.round((day.count / maxWeekDay) * 100)}%`,
                        background: day.count > 0 ? "#6366f1" : "rgba(255,255,255,0.07)",
                      }}
                    />
                  </div>
                  <span style={s.weekLabel}>{day.label}</span>
                  {day.count > 0 && <span style={s.weekCount}>+{day.count}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Comics status */}
        {stats.comicsCount > 0 && (
          <Section title="Comics — by status">
            {stats.comicsStatus.map((row) => (
              <div key={row.key} style={s.barRow}>
                <span style={s.barLabel}>{row.label}</span>
                <Bar value={row.count} max={stats.comicsCount} color={STATUS_COLORS[row.key]} />
                <span style={s.barCount}>{row.count}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Anime status */}
        {stats.animeCount > 0 && (
          <Section title="Anime — by status">
            {stats.animeStatus.map((row) => (
              <div key={row.key} style={s.barRow}>
                <span style={s.barLabel}>{row.label}</span>
                <Bar value={row.count} max={stats.animeCount} color={STATUS_COLORS[row.key]} />
                <span style={s.barCount}>{row.count}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Comics types */}
        {stats.comicsTypes.length > 0 && (
          <Section title="Comics — type breakdown">
            <div style={s.pillRow}>
              {stats.comicsTypes.map(({ label, count }) => (
                <div key={label} style={s.typePill}>
                  <span style={s.typePillLabel}>{label}</span>
                  <span style={s.typePillCount}>{count}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Anime types */}
        {stats.animeTypes.length > 0 && (
          <Section title="Anime — type breakdown">
            <div style={s.pillRow}>
              {stats.animeTypes.map(({ label, count }) => (
                <div key={label} style={s.typePill}>
                  <span style={s.typePillLabel}>{label}</span>
                  <span style={s.typePillCount}>{count}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Tags */}
        {stats.comicsTags.length > 0 && (
          <Section title="Comics — top genres">
            <div style={s.pillRow}>
              {stats.comicsTags.map(({ tag, count }) => (
                <div key={tag} style={{ ...s.typePill, background: "rgba(99,102,241,0.18)" }}>
                  <span style={s.typePillLabel}>{tag}</span>
                  <span style={s.typePillCount}>{count}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {stats.animeTags.length > 0 && (
          <Section title="Anime — top genres">
            <div style={s.pillRow}>
              {stats.animeTags.map(({ tag, count }) => (
                <div key={tag} style={{ ...s.typePill, background: "rgba(14,165,233,0.15)" }}>
                  <span style={s.typePillLabel}>{tag}</span>
                  <span style={s.typePillCount}>{count}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Rating Histogram */}
        {anyRated && (
          <Section title="Rating Distribution">
            {ratingHistogram.filter((b) => b.count > 0).map((b) => (
              <div key={b.label} style={s.barRow}>
                <span style={s.barLabel}>{b.label}</span>
                <Bar value={b.count} max={maxHistogramCount} color={b.color} />
                <span style={s.barCount}>{b.count}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Top Rated */}
        {anyRated && (
          <Section title="Top Rated">
            {topRated.map((item, idx) => (
              <div key={item.id} style={s.topRatedRow}>
                <span style={s.topRatedRank}>#{idx + 1}</span>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    style={s.topRatedImg}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <div style={s.topRatedNoImg}>{item.title[0]}</div>
                )}
                <span style={s.topRatedTitle}>{item.title}</span>
                <span style={s.topRatedRating}>★ {item.rating}</span>
              </div>
            ))}
          </Section>
        )}

        {/* Currently reading / watching */}
        {stats.nowReading.length > 0 && (
          <Section title="Currently Reading">
            <div style={s.activeGrid}>
              {stats.nowReading.map((item) => (
                <div key={item.id} style={s.activeCard}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} style={s.activeImg}
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  ) : (
                    <div style={s.activeNoImg}>{item.title[0]}</div>
                  )}
                  <p style={s.activeTitle}>{item.title}</p>
                  {item.currentProgress > 0 && (
                    <p style={s.activeProgress}>
                      Ch. {item.currentProgress}{item.totalProgress ? `/${item.totalProgress}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {stats.nowWatching.length > 0 && (
          <Section title="Currently Watching">
            <div style={s.activeGrid}>
              {stats.nowWatching.map((item) => (
                <div key={item.id} style={s.activeCard}>
                  {item.image ? (
                    <img src={item.image} alt={item.title} style={s.activeImg}
                      onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  ) : (
                    <div style={s.activeNoImg}>{item.title[0]}</div>
                  )}
                  <p style={s.activeTitle}>{item.title}</p>
                  {item.currentProgress > 0 && (
                    <p style={s.activeProgress}>
                      Ep. {item.currentProgress}{item.totalProgress ? `/${item.totalProgress}` : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
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
    maxWidth: 680,
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
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 12,
  },
  statCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "16px 14px",
    textAlign: "center",
  },
  statValue: {
    fontSize: "1.6rem",
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
  },
  statLabel: {
    marginTop: 6,
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  statSub: {
    marginTop: 4,
    fontSize: "0.76rem",
    color: "#475569",
  },
  section: {},
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: "0.85rem",
    fontWeight: 800,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  barLabel: {
    width: 130,
    flexShrink: 0,
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "#dbe4f0",
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.3s ease",
  },
  barCount: {
    width: 32,
    textAlign: "right",
    fontSize: "0.88rem",
    fontWeight: 800,
    color: "#94a3b8",
    flexShrink: 0,
  },
  pillRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  typePill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.07)",
    borderRadius: 999,
    padding: "6px 12px",
  },
  typePillLabel: {
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "#dbe4f0",
  },
  typePillCount: {
    fontSize: "0.8rem",
    fontWeight: 800,
    color: "#64748b",
  },
  activeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
    gap: 12,
  },
  activeCard: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "center",
    textAlign: "center",
  },
  activeImg: {
    width: "100%",
    aspectRatio: "0.72 / 1",
    objectFit: "cover",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  activeNoImg: {
    width: "100%",
    aspectRatio: "0.72 / 1",
    borderRadius: 12,
    background: "rgba(99,102,241,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: 900,
    color: "#818cf8",
  },
  activeTitle: {
    margin: 0,
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#dbe4f0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  activeProgress: {
    margin: 0,
    fontSize: "0.72rem",
    color: "#64748b",
    fontWeight: 700,
  },
  weekRow: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
  },
  weekCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  weekBarWrap: {
    width: "100%",
    height: 60,
    display: "flex",
    alignItems: "flex-end",
  },
  weekBar: {
    width: "100%",
    borderRadius: "4px 4px 0 0",
    minHeight: 4,
    transition: "height 0.3s ease",
  },
  weekLabel: {
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#475569",
  },
  weekCount: {
    fontSize: "0.65rem",
    fontWeight: 800,
    color: "#818cf8",
  },
  topRatedRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "10px 12px",
    marginBottom: 6,
  },
  topRatedRank: {
    width: 24,
    textAlign: "center",
    fontSize: "0.85rem",
    fontWeight: 900,
    color: "#64748b",
    flexShrink: 0,
  },
  topRatedImg: {
    width: 40,
    height: 56,
    objectFit: "cover",
    borderRadius: 6,
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  topRatedNoImg: {
    width: 40,
    height: 56,
    borderRadius: 6,
    flexShrink: 0,
    background: "rgba(99,102,241,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    fontWeight: 900,
    color: "#818cf8",
  },
  topRatedTitle: {
    flex: 1,
    fontSize: "0.88rem",
    fontWeight: 700,
    color: "#dbe4f0",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  topRatedRating: {
    flexShrink: 0,
    background: "rgba(245,158,11,0.2)",
    color: "#fbbf24",
    borderRadius: 8,
    padding: "4px 8px",
    fontSize: "0.82rem",
    fontWeight: 800,
  },
};
