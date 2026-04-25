import { useState, useEffect, useRef } from "react";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";
import { Card, Fab, PageHeader, PageScroll, SectionHead, EmptyState, LoadingDots } from "../design/components";
import { budgetAPI } from "../utils/api";
import CategoryDetailPage from "./details/CategoryDetailPage";

const CATS = [
  { id: "food",      label: "Food",      color: T.amber,   icon: "meal"    },
  { id: "rent",      label: "Rent",      color: T.violet,  icon: "location" },
  { id: "transport", label: "Transport", color: T.teal,    icon: "bike"    },
  { id: "fitness",   label: "Fitness",   color: "#5C8FFC", icon: "dumbbell" },
  { id: "fun",       label: "Fun",       color: "#FC5C9E", icon: "heart"   },
  { id: "other",     label: "Other",     color: "#FC8B5C", icon: "pill"    },
];

const CAT_BUDGETS = { food: 400, rent: 1200, transport: 150, fitness: 80, fun: 200, other: 150 };

function getCat(id) { return CATS.find(c => c.id === id) || CATS[5]; }

const MOCK_SUMMARY = {
  income: 3200,
  expenses: 2180,
  net: 1020,
  by_category: { food: 340, rent: 1200, transport: 95, fitness: 60, fun: 120, other: 65 },
  sparkline: [1100, 980, 1200, 1050, 1180, 1020],
  week_bars: [42, 85, 65, 120, 95, 180, 110],
  week_avg: 99.6,
};

const MOCK_ENTRIES = [
  { id: "e1", date: "2025-04-24", category: "food",      amount: 18.50, description: "Lidl groceries" },
  { id: "e2", date: "2025-04-24", category: "transport", amount: 4.20,  description: "Bus ticket" },
  { id: "e3", date: "2025-04-23", category: "fitness",   amount: 12.00, description: "Gym session" },
  { id: "e4", date: "2025-04-23", category: "food",      amount: 9.80,  description: "Coffee + lunch" },
  { id: "e5", date: "2025-04-22", category: "fun",       amount: 35.00, description: "Cinema + drinks" },
];

function groupByDate(entries) {
  const groups = {};
  for (const e of entries) {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function DonutChart({ data, active, onSelect }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0) || 1;
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 44;
  const gap = 0.04;

  let offset = -Math.PI / 2;
  const slices = CATS.map((cat) => {
    const val = data[cat.id] || 0;
    const pct = val / total;
    const angle = pct * 2 * Math.PI - gap;
    const slice = { cat, val, pct, startAngle: offset, endAngle: offset + angle };
    offset += pct * 2 * Math.PI;
    return slice;
  }).filter(s => s.val > 0);

  function arcPath(start, end) {
    if (Math.abs(end - start) < 0.001) return "";
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.elevated2} strokeWidth={14} />
      {slices.map(s => (
        <path
          key={s.cat.id}
          d={arcPath(s.startAngle, s.endAngle)}
          fill="none"
          stroke={s.cat.color}
          strokeWidth={active === s.cat.id ? 18 : 14}
          strokeLinecap="round"
          style={{ cursor: "pointer", opacity: active && active !== s.cat.id ? 0.35 : 1, transition: "all 0.2s" }}
          onClick={() => onSelect(active === s.cat.id ? null : s.cat.id)}
        />
      ))}
      {active && (() => {
        const s = slices.find(sl => sl.cat.id === active);
        const cat = getCat(active);
        return s ? (
          <>
            <text x={cx} y={cy - 5} textAnchor="middle" fill={cat.color} fontSize="13" fontWeight="700" fontFamily={T.fontMono}>
              CHF {(s.val).toFixed(0)}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill={T.textMuted} fontSize="9" fontFamily={T.fontFamily}>
              {(s.pct * 100).toFixed(0)}%
            </text>
          </>
        ) : null;
      })()}
    </svg>
  );
}

function SparklineSVG({ data }) {
  if (!data || data.length < 2) return null;
  const w = 200, h = 48;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / range) * (h - 8) - 4,
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const fill = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.teal} stopOpacity="0.25" />
          <stop offset="100%" stopColor={T.teal} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke={T.teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WeekBarsChart({ bars, avg }) {
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
  const max = Math.max(...bars, 1);
  const h = 72;
  const w = 280;
  const barW = 24;
  const gap = (w - DAYS.length * barW) / (DAYS.length - 1);
  const avgY = h - (avg / max) * h;

  return (
    <svg width={w} height={h + 20} viewBox={`0 0 ${w} ${h + 20}`}>
      <defs>
        <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={T.teal} stopOpacity="0.9" />
          <stop offset="100%" stopColor={T.teal} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {bars.map((v, i) => {
        const bh = Math.max((v / max) * h, 2);
        const x = i * (barW + gap);
        return (
          <g key={i}>
            <rect x={x} y={h - bh} width={barW} height={bh} rx={4} fill="url(#bar-grad)" />
            <text x={x + barW / 2} y={h + 14} textAnchor="middle" fill={T.textDim} fontSize="9" fontFamily={T.fontFamily}>{DAYS[i]}</text>
          </g>
        );
      })}
      {avg > 0 && (
        <>
          <line x1={0} y1={avgY} x2={w} y2={avgY} stroke={T.amber} strokeWidth={1} strokeDasharray="4 3" />
          <text x={w - 2} y={avgY - 3} textAnchor="end" fill={T.amber} fontSize="8" fontFamily={T.fontMono}>avg</text>
        </>
      )}
    </svg>
  );
}

function AddExpenseSheet({ onClose, onAdded }) {
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("food");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!amount || parseFloat(amount) <= 0) return;
    setSaving(true);
    try {
      await budgetAPI.add({ amount: parseFloat(amount), category: cat, description: desc || null });
      onAdded();
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
      <div style={{ position: "relative", background: T.surface, borderRadius: "20px 20px 0 0", padding: "20px 20px 36px", border: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Add Expense</div>
          <button onClick={onClose} style={{ background: T.elevated, border: "none", borderRadius: 9999, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textMuted }}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{ padding: "10px 6px", borderRadius: 10, background: cat === c.id ? c.color + "22" : T.elevated, border: `1px solid ${cat === c.id ? c.color + "55" : T.border}`, color: cat === c.id ? c.color : T.textMuted, fontSize: 11, fontWeight: cat === c.id ? 700 : 500, cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Icon name={c.icon} size={16} color={cat === c.id ? c.color : T.textDim} />
              {c.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          step="0.05"
          min="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="CHF 0.00"
          style={{ width: "100%", background: T.elevated, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "12px 14px", fontSize: 20, fontWeight: 700, color: T.text, fontFamily: T.fontMono, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
        />
        <input
          type="text"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description (optional)"
          style={{ width: "100%", background: T.elevated, border: `1px solid ${T.border}`, borderRadius: T.rInput, padding: "10px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none", marginBottom: 16, boxSizing: "border-box" }}
        />
        <button onClick={handleSave} disabled={saving || !amount} style={{ width: "100%", padding: "13px 0", background: T.amber, color: "#0A0A0F", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: saving || !amount ? "not-allowed" : "pointer", opacity: saving || !amount ? 0.5 : 1, fontFamily: "inherit" }}>
          {saving ? "Saving…" : "Add Expense"}
        </button>
      </div>
    </div>
  );
}

export default function BudgetPage({ profile, onProfile }) {
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [entries, setEntries] = useState(MOCK_ENTRIES);
  const [activeDonut, setActiveDonut] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, e] = await Promise.all([budgetAPI.getSummary(), budgetAPI.getAll("month")]);
        if (s) setSummary(s);
        if (e?.entries?.length) setEntries(e.entries);
      } catch {
        // use mock
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function reload() {
    try {
      const [s, e] = await Promise.all([budgetAPI.getSummary(), budgetAPI.getAll("month")]);
      if (s) setSummary(s);
      if (e?.entries?.length) setEntries(e.entries);
    } catch {}
  }

  const net = (summary?.income || 0) - (summary?.expenses || 0);
  const catData = summary?.by_category || MOCK_SUMMARY.by_category;
  const totalExp = Object.values(catData).reduce((s, v) => s + v, 0) || 1;
  const grouped = groupByDate(entries);

  function fmtDate(d) {
    const dt = new Date(d + "T00:00:00");
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.round((today - dt) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg, position: "relative" }}>
      <PageHeader
        title="Budget"
        subtitle="April · 20 days remain"
        profile={profile}
        onProfile={onProfile}
        trailing={
          <button style={{ width: 32, height: 32, borderRadius: 9999, background: T.elevated, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.textMuted }}>
            <Icon name="settings" size={16} />
          </button>
        }
      />

      <PageScroll>
        {/* 2-col stat chips */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px 16px" }}>
          {[
            { label: "Income", value: `CHF ${(summary?.income || 0).toFixed(0)}`, color: T.teal, icon: "trend-up" },
            { label: "Expenses", value: `CHF ${(summary?.expenses || 0).toFixed(0)}`, color: T.negative, icon: "budget" },
          ].map(s => (
            <div key={s.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: s.color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={s.icon} size={17} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.text, fontFamily: T.fontMono, marginTop: 1 }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Net balance card with sparkline */}
        <div style={{ margin: "0 20px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Net Balance</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: T.fontMono, color: net >= 0 ? T.teal : T.negative, letterSpacing: -1 }}>
              CHF {net >= 0 ? "+" : ""}{net.toFixed(0)}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>this month</div>
          </div>
          <SparklineSVG data={summary?.sparkline || MOCK_SUMMARY.sparkline} />
        </div>

        {/* Donut + legend */}
        <div style={{ margin: "0 20px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>Spending by Category</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <DonutChart data={catData} active={activeDonut} onSelect={setActiveDonut} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {CATS.map(cat => {
                const val = catData[cat.id] || 0;
                const pct = ((val / totalExp) * 100).toFixed(0);
                const isActive = activeDonut === cat.id;
                return (
                  <div key={cat.id} onClick={() => setActiveDonut(activeDonut === cat.id ? null : cat.id)} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", opacity: activeDonut && !isActive ? 0.4 : 1, transition: "opacity 0.15s" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 11, color: T.text, fontWeight: isActive ? 700 : 500 }}>{cat.label}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono }}>{pct}%</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: cat.color, fontFamily: T.fontMono, minWidth: 44, textAlign: "right" }}>{val.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category progress tiles */}
        <div style={{ padding: "0 20px 16px" }}>
          <SectionHead title="Category budgets" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {CATS.map(cat => {
              const spent = catData[cat.id] || 0;
              const budget = CAT_BUDGETS[cat.id] || 200;
              const pct = Math.min(spent / budget, 1);
              const over = spent > budget;
              return (
                <div key={cat.id} onClick={() => setSelectedCategory({ ...cat, spent, budget, txCount: Math.round(spent / 40) + 2 })} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 13px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{cat.label}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: over ? T.negative : T.text, fontFamily: T.fontMono, marginBottom: 2 }}>
                    CHF {spent.toFixed(0)} <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 400 }}>/ {budget}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 9999, background: T.elevated2, overflow: "hidden", marginTop: 6 }}>
                    <div style={{ width: `${pct * 100}%`, height: "100%", background: over ? T.negative : cat.color, borderRadius: 9999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Week bar chart */}
        <div style={{ margin: "0 20px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rCard, padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>This Week</div>
          <WeekBarsChart bars={summary?.week_bars || MOCK_SUMMARY.week_bars} avg={summary?.week_avg || MOCK_SUMMARY.week_avg} />
        </div>

        {/* Transaction history */}
        <div style={{ padding: "0 20px 24px" }}>
          <SectionHead title="Transactions" />
          {loading && <LoadingDots />}
          {!loading && grouped.length === 0 && (
            <EmptyState icon="budget" title="No transactions" subtitle="Tap + to log your first expense" />
          )}
          {grouped.map(([date, items]) => {
            const dayTotal = items.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={date} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.3 }}>{fmtDate(date)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: T.fontMono }}>CHF {dayTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map(e => {
                    const cat = getCat(e.category);
                    return (
                      <div key={e.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name={cat.icon} size={17} color={cat.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{e.description || cat.label}</div>
                          <div style={{ fontSize: 10, color: cat.color, background: cat.color + "18", borderRadius: 5, padding: "1px 6px", display: "inline-block", marginTop: 3, fontWeight: 600 }}>{cat.label}</div>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: T.fontMono }}>CHF {e.amount.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PageScroll>

      <Fab onClick={() => setShowAdd(true)} icon="plus" color={T.amber} />
      {showAdd && <AddExpenseSheet onClose={() => setShowAdd(false)} onAdded={reload} />}
      {selectedCategory && (
        <CategoryDetailPage
          category={selectedCategory}
          onBack={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
}
