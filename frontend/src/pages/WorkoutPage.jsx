import { useState, useEffect } from "react";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";
import { Card, Chip, Fab, PageHeader, PageScroll, SectionHead, EmptyState, LoadingDots } from "../design/components";
import { workoutAPI } from "../utils/api";
import TemplateDetailPage from "./details/TemplateDetailPage";
import WorkoutLogPage from "./details/WorkoutLogPage";

const SPORTS = [
  { id: "crossfit", label: "CrossFit", icon: "flame" },
  { id: "running", label: "Running", icon: "run" },
  { id: "cycling", label: "Cycling", icon: "bike" },
  { id: "hyrox", label: "Hyrox", icon: "bolt" },
  { id: "lifting", label: "Lifting", icon: "dumbbell" },
];

const MOCK_TEMPLATES = [
  { id: "t1", tag: "STRENGTH", tagColor: T.teal, name: "Push Day", exercises: 7, duration: "60–75 min", muscles: ["Chest", "Triceps", "Shoulders"], workout_type: "strength" },
  { id: "t2", tag: "HYROX", tagColor: T.violet, name: "Hyrox Sim", exercises: 8, duration: "75–90 min", muscles: ["Full Body", "Cardio"], workout_type: "hyrox" },
  { id: "t3", tag: "STRENGTH", tagColor: T.teal, name: "Pull Day", exercises: 6, duration: "55–70 min", muscles: ["Back", "Biceps"], workout_type: "strength" },
  { id: "t4", tag: "CARDIO", tagColor: T.amber, name: "Zone 2 Run", exercises: 1, duration: "40–50 min", muscles: ["Legs", "Cardio"], workout_type: "running" },
];

const MOCK_HISTORY = [
  { id: "h1", workout_type: "strength", type: "strength", date: "2025-04-22", duration_minutes: 68, calories_burned_est: 420, intensity: "high", name: "Push Day" },
  { id: "h2", workout_type: "running", type: "running", date: "2025-04-20", duration_minutes: 45, calories_burned_est: 380, intensity: "moderate", name: "Zone 2" },
  { id: "h3", workout_type: "hyrox", type: "hyrox", date: "2025-04-18", duration_minutes: 82, calories_burned_est: 610, intensity: "high", name: "Hyrox Sim" },
];

const INTENSITY_COLORS = { high: T.negative, moderate: T.amber, low: T.teal };

function IntensityBadge({ level }) {
  const color = INTENSITY_COLORS[level] || T.textMuted;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: color + "22", padding: "2px 8px", borderRadius: 6, textTransform: "capitalize", letterSpacing: 0.3 }}>
      {level}
    </span>
  );
}

function HeroCard({ onStart, onBrowse }) {
  return (
    <div style={{ margin: "0 20px 20px", borderRadius: T.rCard, background: `linear-gradient(135deg, ${T.teal}1A 0%, ${T.violet}33 100%)`, border: `1px solid ${T.teal}33`, padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${T.violet}44, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.teal, letterSpacing: 1.4, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
        Today's suggestion
      </div>
      <div style={{ fontSize: 23, fontWeight: 800, color: T.text, letterSpacing: -0.6, marginBottom: 4, lineHeight: 1.15 }}>
        Push Day · Chest + Tri
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 20 }}>
        7 exercises · 60–75 min · last done 4d ago
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onStart} style={{ flex: 1, padding: "11px 0", background: T.teal, color: "#0A0A0F", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.1 }}>
          Start Suggested
        </button>
        <button onClick={onBrowse} style={{ flex: 1, padding: "11px 0", background: "transparent", color: T.text, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          Browse Templates
        </button>
      </div>
    </div>
  );
}

function SportChips({ active, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 20px 20px", scrollbarWidth: "none" }}>
      {SPORTS.map((s) => (
        <button key={s.id} onClick={() => onSelect(s.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9999, background: active === s.id ? T.teal : T.elevated, border: `1px solid ${active === s.id ? T.teal : T.border}`, color: active === s.id ? "#0A0A0F" : T.text, fontSize: 13, fontWeight: active === s.id ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
          <Icon name={s.icon} size={15} color={active === s.id ? "#0A0A0F" : T.textMuted} />
          {s.label}
        </button>
      ))}
    </div>
  );
}

function TemplateCard({ t, onStart }) {
  return (
    <div style={{ width: 220, flexShrink: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{ alignSelf: "flex-start", fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: t.tagColor, background: t.tagColor + "22", padding: "3px 8px", borderRadius: 6 }}>
        {t.tag}
      </span>
      <div style={{ fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>{t.name}</div>
      <div style={{ fontSize: 12, color: T.textMuted }}>{t.exercises} exercises · {t.duration}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {(t.muscles || []).map((m) => (
          <span key={m} style={{ fontSize: 10, color: T.textMuted, background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: "2px 7px" }}>{m}</span>
        ))}
      </div>
      <button onClick={() => onStart(t)} style={{ marginTop: "auto", padding: "8px 0", background: T.teal + "22", color: T.teal, border: `1px solid ${T.teal}44`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        Start
      </button>
    </div>
  );
}

function HistoryCard({ w, onClick }) {
  const type = w.workout_type || w.type || "strength";
  const isStrength = type === "strength";
  const isHyrox = type === "hyrox";
  const borderColor = isHyrox ? T.violet : isStrength ? T.teal : T.amber;
  const iconName = isStrength ? "dumbbell" : isHyrox ? "bolt" : "run";
  const date = w.date || w.logged_at?.split("T")[0] || "—";
  const duration = w.duration_minutes || w.duration || 0;
  const calories = w.calories_burned_est || w.calories || 0;
  const intensity = w.intensity || "moderate";

  return (
    <div onClick={onClick} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${borderColor}`, borderRadius: T.rCard, padding: "14px 16px", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: borderColor + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={iconName} size={18} color={borderColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.text, textTransform: "capitalize" }}>{w.name || type}</span>
          <IntensityBadge level={intensity} />
        </div>
        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 10, fontFamily: T.fontMono }}>{date}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Duration", value: `${duration}m` },
            { label: "Calories", value: calories ? `${calories}` : "—" },
            { label: "Intensity", value: intensity },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.fontMono, textTransform: "capitalize" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WorkoutPage({ profile, onProfile }) {
  const [activeSport, setActiveSport] = useState("lifting");
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [liveSession, setLiveSession] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [logs, tmpl] = await Promise.all([workoutAPI.getAll(14), workoutAPI.getTemplates()]);
        if (logs?.workouts?.length) setHistory(logs.workouts);
        if (tmpl?.templates?.length) setTemplates(tmpl.templates.map(mapTemplate));
      } catch {
        // use mock defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function mapTemplate(t) {
    return {
      ...t,
      tag: (t.workout_type || "strength").toUpperCase(),
      tagColor: t.workout_type === "running" ? T.amber : t.workout_type === "hyrox" ? T.violet : T.teal,
      exercises: t.exercises?.length || 0,
      duration: t.estimated_duration ? `${t.estimated_duration} min` : "—",
      muscles: t.exercises?.slice(0, 3).map((e) => e.name) || [],
    };
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg, position: "relative" }}>
      <PageHeader title="Workout" subtitle="Day 4 of your cut · 128 days in" profile={profile} onProfile={onProfile} />

      <PageScroll>
        <HeroCard onStart={() => setLiveSession(true)} onBrowse={() => {}} />

        <SportChips active={activeSport} onSelect={setActiveSport} />

        <div style={{ padding: "0 20px 8px" }}>
          <SectionHead title="Templates" trailing={<span style={{ fontSize: 12, color: T.teal, cursor: "pointer" }}>See all</span>} />
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "4px 20px 24px", scrollbarWidth: "none" }}>
          {templates.map((t) => (
            <TemplateCard key={t.id} t={t} onStart={() => setSelectedTemplate(t)} />
          ))}
        </div>

        <div style={{ padding: "0 20px 16px" }}>
          <SectionHead title="Recent" />
          {loading && <LoadingDots />}
          {!loading && history.length === 0 && (
            <EmptyState icon="dumbbell" title="No workouts yet" subtitle="Log your first session to see your history here" />
          )}
          {history.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.map((w) => (
                <HistoryCard key={w.id} w={w} onClick={() => setSelectedLog(w)} />
              ))}
            </div>
          )}
        </div>
      </PageScroll>

      <Fab onClick={() => setLiveSession(true)} icon="plus" />

      {selectedTemplate && (
        <TemplateDetailPage
          template={selectedTemplate}
          onBack={() => setSelectedTemplate(null)}
          onStart={() => { setSelectedTemplate(null); setLiveSession(true); }}
        />
      )}
      {selectedLog && (
        <WorkoutLogPage
          workout={selectedLog}
          onBack={() => setSelectedLog(null)}
          mode="history"
        />
      )}
      {liveSession && (
        <WorkoutLogPage
          onBack={() => setLiveSession(false)}
          mode="live"
        />
      )}
    </div>
  );
}
