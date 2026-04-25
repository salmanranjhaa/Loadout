import { useState, useEffect } from "react";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";
import { PageHeader, PageScroll, SectionHead, MiniStat, LoadingDots } from "../design/components";
import { analyticsAPI, workoutAPI } from "../utils/api";

const RANGES = ["Week", "Month", "3 Months"];

const MOCK_WEIGHTS = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  weight_kg: 82.4 - i * 0.028 + Math.sin(i * 0.7) * 0.3,
}));

const MOCK_PRs = [
  { exercise: "Bench Press",   value: "102.5 kg", date: "Apr 18" },
  { exercise: "Squat",         value: "135 kg",   date: "Apr 12" },
  { exercise: "Deadlift",      value: "160 kg",   date: "Apr 5"  },
  { exercise: "Overhead Press",value: "70 kg",    date: "Mar 28" },
];

const MOCK_NUTRITION = Array.from({ length: 7 }, (_, i) => ({
  label: ["M","T","W","T","F","S","S"][i],
  protein: 155 + Math.floor(Math.random() * 40),
  carbs:   200 + Math.floor(Math.random() * 60),
  fat:     65  + Math.floor(Math.random() * 20),
}));

function SparklineArea({ data, color = T.teal, height = 100, width = "100%" }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.weight_kg);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 300;
  const H = height;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * W,
    H - ((v - min) / range) * (H - 12) - 6,
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const fill = `${path} L ${W} ${H} L 0 ${H} Z`;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#area-grad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={color} />
    </svg>
  );
}

function Heatmap({ workouts }) {
  // 13 weeks × 7 days
  const COLS = 13;
  const ROWS = 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let col = COLS - 1; col >= 0; col--) {
    for (let row = 0; row < ROWS; row++) {
      const d = new Date(today);
      const daysBack = col * 7 + (ROWS - 1 - row) - (today.getDay() === 0 ? 6 : today.getDay() - 1);
      d.setDate(today.getDate() - daysBack);
      const dateStr = d.toISOString().slice(0, 10);
      const count = workouts.filter(w => (w.date || w.logged_at?.slice(0,10)) === dateStr).length;
      cells.push({ col: COLS - 1 - col, row, count, date: dateStr });
    }
  }

  const cellSize = 11;
  const gap = 3;
  const totalW = COLS * (cellSize + gap) - gap;
  const totalH = ROWS * (cellSize + gap) - gap;

  function intensityColor(count) {
    if (count === 0) return T.elevated2;
    if (count === 1) return T.teal + "55";
    if (count === 2) return T.teal + "99";
    return T.teal;
  }

  return (
    <svg width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}>
      {cells.map((c, i) => (
        <rect
          key={i}
          x={c.col * (cellSize + gap)}
          y={c.row * (cellSize + gap)}
          width={cellSize}
          height={cellSize}
          rx={2}
          fill={intensityColor(c.count)}
        />
      ))}
    </svg>
  );
}

function StackedBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxTotal = Math.max(...data.map(d => d.protein + d.carbs + d.fat));
  const H = 80;
  const barW = 26;
  const gap = 8;
  const W = data.length * (barW + gap) - gap;

  return (
    <svg width="100%" height={H + 20} viewBox={`0 0 ${W} ${H + 20}`}>
      {data.map((d, i) => {
        const total = d.protein + d.carbs + d.fat;
        const scale = H / maxTotal;
        const fatH    = d.fat    * scale;
        const carbsH  = d.carbs  * scale;
        const protH   = d.protein * scale;
        const x = i * (barW + gap);
        let y = H;
        return (
          <g key={i}>
            {[
              { h: fatH,   color: T.violet },
              { h: carbsH, color: T.amber  },
              { h: protH,  color: T.teal   },
            ].map((seg, si) => {
              y -= seg.h;
              return (
                <rect key={si} x={x} y={y} width={barW} height={seg.h} fill={seg.color} rx={si === 2 ? 3 : 0} />
              );
            })}
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fill={T.textDim} fontSize="9" fontFamily={T.fontFamily}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function AnalyticsPage({ profile, onProfile }) {
  const [range, setRange] = useState("Month");
  const [weights, setWeights] = useState(MOCK_WEIGHTS);
  const [workouts, setWorkouts] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const days = range === "Week" ? 7 : range === "Month" ? 30 : 90;
        const [dash, wData, wkData] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getWeights ? analyticsAPI.getWeights(days) : analyticsAPI.getWeights?.(days),
          workoutAPI.getAll(days),
        ]);
        if (dash) setDashboard(dash);
        if (wData?.weights?.length) setWeights(wData.weights);
        if (wkData?.workouts) setWorkouts(wkData.workouts);
      } catch {
        // use mock
      } finally {
        setLoading(false);
      }
    })();
  }, [range]);

  const current = dashboard?.weight?.current || weights[weights.length - 1]?.weight_kg;
  const oldest  = weights[0]?.weight_kg;
  const delta   = current && oldest ? (current - oldest).toFixed(1) : null;
  const weekChange = dashboard?.weight?.week_change ?? (delta ? parseFloat(delta) / (weights.length / 7) : null);
  const goalWeight = profile?.target_weight_kg;

  const displayWeights = range === "Week" ? weights.slice(-7) : range === "Month" ? weights.slice(-30) : weights;
  const totalSessions = workouts.length;
  const totalMinutes = workouts.reduce((s, w) => s + (w.duration_minutes || w.duration || 0), 0);

  const avgKcal = dashboard?.nutrition_this_week?.avg_calories || 2140;
  const avgProtein = dashboard?.nutrition_this_week?.avg_protein || 162;
  const protTarget = profile?.daily_protein_target || 190;
  const protAdherence = Math.round((avgProtein / protTarget) * 100);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg }}>
      <PageHeader title="Analytics" subtitle="Insight across body, fitness, food" profile={profile} onProfile={onProfile} />

      <PageScroll>
        {/* Range picker */}
        <div style={{ display: "flex", gap: 8, padding: "0 20px 20px" }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{ padding: "7px 16px", borderRadius: 9999, background: range === r ? T.teal : T.elevated, border: `1px solid ${range === r ? T.teal : T.border}`, color: range === r ? "#0A0A0F" : T.text, fontSize: 12, fontWeight: range === r ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
              {r}
            </button>
          ))}
        </div>

        {/* ── Body section ── */}
        <div style={{ padding: "0 20px 8px" }}>
          <SectionHead title="Body" />
        </div>
        <div style={{ margin: "0 20px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 38, fontWeight: 800, fontFamily: T.fontMono, color: T.text, letterSpacing: -2, lineHeight: 1 }}>
                {current ? current.toFixed(1) : "—"}
                <span style={{ fontSize: 16, fontWeight: 500, color: T.textMuted, letterSpacing: 0 }}> kg</span>
              </div>
              {weekChange != null && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: (weekChange <= 0 ? T.teal : T.negative) + "22", border: `1px solid ${(weekChange <= 0 ? T.teal : T.negative)}44`, borderRadius: 9999, padding: "4px 10px" }}>
                  <Icon name={weekChange <= 0 ? "trend-up" : "trend-up"} size={12} color={weekChange <= 0 ? T.teal : T.negative} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: weekChange <= 0 ? T.teal : T.negative, fontFamily: T.fontMono }}>
                    {weekChange > 0 ? "+" : ""}{weekChange.toFixed(1)} kg / wk
                  </span>
                </div>
              )}
            </div>
            {goalWeight && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 3 }}>Goal</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.text, fontFamily: T.fontMono }}>{goalWeight} kg</div>
                {current && (
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{Math.abs(current - goalWeight).toFixed(1)} kg to go</div>
                )}
              </div>
            )}
          </div>
          <SparklineArea data={displayWeights} color={T.teal} height={80} />
          {displayWeights.length > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 9, color: T.textDim, fontFamily: T.fontMono }}>{displayWeights[0]?.date}</span>
              <span style={{ fontSize: 9, color: T.textDim, fontFamily: T.fontMono }}>{displayWeights[displayWeights.length - 1]?.date}</span>
            </div>
          )}
        </div>

        {/* ── Fitness section ── */}
        <div style={{ padding: "0 20px 8px" }}>
          <SectionHead title="Fitness" />
        </div>

        {/* Heatmap */}
        <div style={{ margin: "0 20px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 12 }}>90-day frequency</div>
          <div style={{ overflowX: "auto", scrollbarWidth: "none" }}>
            <Heatmap workouts={workouts} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 9, color: T.textDim }}>Less</span>
            {[T.elevated2, T.teal + "55", T.teal + "99", T.teal].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
            ))}
            <span style={{ fontSize: 9, color: T.textDim }}>More</span>
          </div>
        </div>

        {/* Fitness mini-stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px 16px" }}>
          <MiniStat label="Total sessions" value={String(totalSessions)} />
          <MiniStat label="Total minutes" value={String(totalMinutes)} />
        </div>

        {/* PRs */}
        <div style={{ margin: "0 20px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Recent PRs</div>
          {MOCK_PRs.map((pr, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: i < MOCK_PRs.length - 1 ? 12 : 0, marginBottom: i < MOCK_PRs.length - 1 ? 12 : 0, borderBottom: i < MOCK_PRs.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.teal + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="trend-up" size={14} color={T.teal} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{pr.exercise}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{pr.date}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.teal, fontFamily: T.fontMono }}>{pr.value}</div>
            </div>
          ))}
        </div>

        {/* ── Nutrition section ── */}
        <div style={{ padding: "0 20px 8px" }}>
          <SectionHead title="Nutrition" />
        </div>

        <div style={{ margin: "0 20px 12px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: "16px 18px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 16 }}>Daily calories by macro</div>
          <StackedBarChart data={MOCK_NUTRITION} />
          <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
            {[
              { label: "Protein", color: T.teal   },
              { label: "Carbs",   color: T.amber  },
              { label: "Fat",     color: T.violet },
            ].map(m => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                <span style={{ fontSize: 11, color: T.textMuted }}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition mini-stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 20px 32px" }}>
          <MiniStat label="Avg kcal" value={`${avgKcal}`} />
          <MiniStat label="Avg protein" value={`${avgProtein}g`} />
          <MiniStat label="P adherence" value={`${protAdherence}%`} />
        </div>
      </PageScroll>
    </div>
  );
}
