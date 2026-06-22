import React, { useMemo, useState } from "react";
import { ACTIVITY_KEY } from "./SettingsModal";

export default function HistoryModal({ onClose }) {
  const [calView, setCalView] = useState(false);
  const [calOffset, setCalOffset] = useState(0); // 0 = current month, -1 = last month, etc.
  const activityLog = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]"); } catch { return []; }
  }, []);

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

  // Group by date descending
  const grouped = useMemo(() => {
    const map = new Map();
    for (const entry of [...activityLog].reverse()) {
      if (!map.has(entry.date)) map.set(entry.date, []);
      map.get(entry.date).push(entry);
    }
    return [...map.entries()];
  }, [activityLog]);

  // 30-day heatmap
  const heatmap = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split("T")[0];
      const count = activityLog.filter((e) => e.date === date).reduce((s, e) => s + (e.delta || 1), 0);
      days.push({ date, count });
    }
    return days;
  }, [activityLog]);

  const maxHeat = Math.max(...heatmap.map((d) => d.count), 1);

  // Calendar month data
  const calendarData = useMemo(() => {
    const now = new Date();
    now.setDate(1);
    now.setMonth(now.getMonth() + calOffset);
    const year = now.getFullYear();
    const month = now.getMonth();
    const label = now.toLocaleDateString("en", { month: "long", year: "numeric" });
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    // leading empty cells
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const count = activityLog
        .filter((e) => e.date === date)
        .reduce((s, e) => s + (e.delta || 1), 0);
      cells.push({ date, d, count });
    }
    return { label, cells };
  }, [activityLog, calOffset]);

  function heatColor(count) {
    if (!count) return "rgba(255,255,255,0.05)";
    const intensity = count / maxHeat;
    if (intensity < 0.33) return "rgba(99,102,241,0.3)";
    if (intensity < 0.66) return "rgba(99,102,241,0.6)";
    return "#6366f1";
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return d.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" });
  }

  const totalSessions = activityLog.length;
  const totalProgress = activityLog.reduce((s, e) => s + (e.delta || 1), 0);
  const uniqueDays = new Set(activityLog.map((e) => e.date)).size;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} className="pv-modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.heading}>Reading History</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Stats row */}
        <div style={s.statRow}>
          <div style={s.stat}>
            <span style={s.statVal}>{streak}d</span>
            <span style={s.statLbl}>Current Streak</span>
          </div>
          <div style={s.stat}>
            <span style={s.statVal}>{totalProgress}</span>
            <span style={s.statLbl}>Total Progress</span>
          </div>
          <div style={s.stat}>
            <span style={s.statVal}>{uniqueDays}</span>
            <span style={s.statLbl}>Active Days</span>
          </div>
          <div style={s.stat}>
            <span style={s.statVal}>{totalSessions}</span>
            <span style={s.statLbl}>Sessions</span>
          </div>
        </div>

        {/* Heatmap / Calendar toggle */}
        {activityLog.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ ...s.sectionTitle, margin: 0 }}>
                {calView ? calendarData.label : "Last 30 days"}
              </p>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {calView && (
                  <>
                    <button onClick={() => setCalOffset((o) => o - 1)} style={s.calNav}>‹</button>
                    <button onClick={() => setCalOffset((o) => Math.min(0, o + 1))} style={s.calNav} disabled={calOffset === 0}>›</button>
                  </>
                )}
                <button onClick={() => setCalView((v) => !v)} style={s.viewToggle}>
                  {calView ? "Heatmap" : "Calendar"}
                </button>
              </div>
            </div>

            {!calView && (
              <div style={s.heatmap}>
                {heatmap.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count}`}
                    style={{ ...s.heatCell, background: heatColor(day.count) }}
                  />
                ))}
              </div>
            )}

            {calView && (
              <div>
                <div style={s.calDayRow}>
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                    <div key={d} style={s.calDayLabel}>{d}</div>
                  ))}
                </div>
                <div style={s.calGrid}>
                  {calendarData.cells.map((cell, i) => {
                    if (!cell) return <div key={`empty-${i}`} />;
                    const today = new Date().toISOString().split("T")[0];
                    const isToday = cell.date === today;
                    return (
                      <div
                        key={cell.date}
                        title={cell.count ? `${cell.count} progress` : ""}
                        style={{
                          ...s.calCell,
                          background: cell.count ? heatColor(cell.count) : "rgba(255,255,255,0.03)",
                          outline: isToday ? "2px solid #6366f1" : "none",
                          color: cell.count ? "#f8fafc" : "#475569",
                          fontWeight: isToday ? 800 : 600,
                        }}
                      >
                        {cell.d}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {grouped.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyTitle}>No activity yet</p>
            <p style={s.emptyText}>Use the +1 button on any series to start tracking.</p>
          </div>
        ) : (
          <div style={s.timeline}>
            {grouped.map(([date, entries]) => (
              <div key={date} style={s.dayGroup}>
                <p style={s.dayLabel}>{formatDate(date)}</p>
                {entries.map((entry, i) => (
                  <div key={i} style={s.entry}>
                    <div style={s.entryDot} />
                    <span style={s.entryTitle}>{entry.title}</span>
                    <span style={s.entryDelta}>+{entry.delta || 1}</span>
                  </div>
                ))}
              </div>
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
    width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto",
    background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 26, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
    display: "flex", flexDirection: "column", gap: 20,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  heading: { margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" },
  closeBtn: {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "#94a3b8", cursor: "pointer", fontSize: "1rem",
    width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
  },
  statRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  stat: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "14px 10px", textAlign: "center",
    display: "flex", flexDirection: "column", gap: 4,
  },
  statVal: { fontSize: "1.5rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.03em" },
  statLbl: { fontSize: "0.7rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" },
  sectionTitle: {
    margin: "0 0 10px", fontSize: "0.8rem", fontWeight: 800,
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em",
  },
  heatmap: {
    display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4,
  },
  heatCell: {
    aspectRatio: "1", borderRadius: 4, cursor: "default",
    transition: "opacity 0.15s",
  },
  viewToggle: {
    background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 8, color: "#a5b4fc", fontSize: "0.78rem", fontWeight: 700,
    padding: "5px 10px", cursor: "pointer",
  },
  calNav: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, color: "#94a3b8", fontSize: "1rem", fontWeight: 700,
    padding: "3px 8px", cursor: "pointer",
  },
  calDayRow: {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4,
  },
  calDayLabel: {
    textAlign: "center", fontSize: "0.65rem", fontWeight: 800,
    color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em",
  },
  calGrid: {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3,
  },
  calCell: {
    aspectRatio: "1", borderRadius: 6, display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: "0.75rem", transition: "background 0.15s",
  },
  timeline: { display: "flex", flexDirection: "column", gap: 16 },
  dayGroup: { display: "flex", flexDirection: "column", gap: 6 },
  dayLabel: {
    margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 800,
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em",
  },
  entry: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10, padding: "9px 12px",
  },
  entryDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#6366f1", flexShrink: 0,
  },
  entryTitle: { flex: 1, fontSize: "0.9rem", fontWeight: 600, color: "#dbe4f0" },
  entryDelta: {
    fontSize: "0.82rem", fontWeight: 800, color: "#818cf8",
    background: "rgba(99,102,241,0.15)", borderRadius: 6, padding: "2px 7px",
  },
  empty: { textAlign: "center", padding: "32px 0" },
  emptyTitle: { margin: "0 0 6px", fontWeight: 800, color: "#f1f5f9" },
  emptyText: { margin: 0, color: "#475569", fontSize: "0.88rem" },
};
