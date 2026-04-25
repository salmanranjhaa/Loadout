import { useState } from "react";
import { T } from "../../design/tokens";
import { Icon } from "../../design/icons";
import { Card, DetailHeader, PageScroll, MacroBar } from "../../design/components";

const MOCK_TRANSACTIONS = [
  { id: 1, name: "Whole Foods Market", date: "Apr 24", amount: 89.40, sub: "Groceries · Weekly shop" },
  { id: 2, name: "Trader Joe's", date: "Apr 22", amount: 34.80, sub: "Groceries · Snacks + produce" },
  { id: 3, name: "Instacart", date: "Apr 20", amount: 112.60, sub: "Groceries + delivery fee" },
  { id: 4, name: "Costco", date: "Apr 17", amount: 210.00, sub: "Bulk · Chicken, eggs, oats" },
  { id: 5, name: "Walmart Grocery", date: "Apr 14", amount: 58.20, sub: "Weekly essentials" },
  { id: 6, name: "Sprouts Farmers", date: "Apr 10", amount: 45.90, sub: "Organic produce" },
  { id: 7, name: "Amazon Fresh", date: "Apr 07", amount: 72.30, sub: "Pantry restock" },
];

// 12-week trend data
const WEEKLY = [180, 210, 165, 190, 240, 175, 205, 195, 220, 180, 245, 230];

function SpendingChart({ data, color }) {
  const max = Math.max(...data);
  const w = 280;
  const h = 80;
  const barW = Math.floor(w / data.length) - 3;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const barH = Math.max(4, (v / max) * (h - 10));
        const x = i * (barW + 3);
        const y = h - barH;
        const isLast = i === data.length - 1;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={3}
            fill={isLast ? color : color + "55"}
          />
        );
      })}
    </svg>
  );
}

function TrendLine({ data, color }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 280;
  const h = 56;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const path = "M" + pts.join(" L");
  const area = path + ` L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#area-grad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CategoryDetailPage({ category = {}, onBack }) {
  const {
    name = "Groceries",
    icon = "meal",
    color = T.teal,
    spent = 680,
    budget = 800,
    txCount = 7,
  } = category;

  const [tab, setTab] = useState("transactions");
  const pct = spent / budget;
  const remaining = budget - spent;
  const over = remaining < 0;

  const transactions = MOCK_TRANSACTIONS.slice(0, txCount);
  const avgWeekly = Math.round(WEEKLY.reduce((a, b) => a + b, 0) / WEEKLY.length);

  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 10,
        background: T.bg, display: "flex", flexDirection: "column",
        animation: "lo-slide-in 0.25s cubic-bezier(0.32,0.72,0,1) forwards",
      }}
    >
      <DetailHeader
        onBack={onBack}
        title={name}
        subtitle={`${txCount} transactions this month`}
      />

      <PageScroll padBottom={40}>
        {/* Hero stats */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{
            borderRadius: 18, padding: 20,
            background: `linear-gradient(135deg, ${color}22, ${color}08)`,
            border: `1px solid ${color}33`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={icon} size={22} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontFamily: T.fontMono, color: color, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
                  {name} · April 2025
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: T.text, letterSpacing: -1, fontFamily: T.fontMono, marginTop: 2 }}>
                  ${spent.toFixed(0)}
                  <span style={{ fontSize: 14, fontWeight: 500, color: T.textMuted, letterSpacing: 0, fontFamily: T.fontFamily }}> / ${budget}</span>
                </div>
              </div>
            </div>

            <div style={{ height: 6, borderRadius: 9999, background: T.elevated2, overflow: "hidden", marginBottom: 12 }}>
              <div style={{
                width: `${Math.min(pct * 100, 100)}%`,
                height: "100%",
                background: over ? T.negative : color,
                borderRadius: 9999,
                transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
              }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: T.textMuted }}>
                {over
                  ? <span style={{ color: T.negative, fontWeight: 600 }}>${Math.abs(remaining).toFixed(0)} over budget</span>
                  : <span>${remaining.toFixed(0)} remaining</span>
                }
              </div>
              <div style={{ fontSize: 12, fontFamily: T.fontMono, color: over ? T.negative : color, fontWeight: 600 }}>
                {Math.round(pct * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ padding: "0 16px 20px", display: "flex", gap: 8 }}>
          {[
            { label: "Avg/week", value: `$${avgWeekly}`, icon: "analytics" },
            { label: "Transactions", value: txCount, icon: "budget" },
            { label: "vs last mo.", value: "+12%", icon: "run", valueColor: T.negative },
          ].map(({ label, value, icon: ic, valueColor }) => (
            <div key={label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.fontMono, color: valueColor || T.text }}>{value}</div>
              <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 600, marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tab selector */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", background: T.elevated, borderRadius: 12, padding: 3 }}>
            {["transactions", "trend"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, border: "none",
                  background: tab === t ? T.elevated2 : "transparent",
                  color: tab === t ? T.text : T.textMuted,
                  fontSize: 12, fontWeight: tab === t ? 600 : 500,
                  cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {t === "transactions" ? "Transactions" : "12-Week Trend"}
              </button>
            ))}
          </div>
        </div>

        {tab === "transactions" && (
          <div style={{ padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            {transactions.map((tx) => (
              <Card key={tx.id} style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={icon} size={17} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{tx.name}</div>
                    <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.fontMono, marginTop: 2 }}>{tx.sub}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: T.fontMono, color: T.text }}>
                      -${tx.amount.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{tx.date}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "trend" && (
          <div style={{ padding: "0 16px 20px" }}>
            <Card style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
                Monthly spend · last 12 weeks
              </div>
              <TrendLine data={WEEKLY} color={color} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 9, color: T.textDim, fontFamily: T.fontMono }}>12w ago</span>
                <span style={{ fontSize: 9, color: T.textDim, fontFamily: T.fontMono }}>now</span>
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `0.5px solid ${T.border}` }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: T.elevated, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>Lowest week</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.fontMono, color: T.teal }}>${Math.min(...WEEKLY)}</div>
                  </div>
                  <div style={{ flex: 1, background: T.elevated, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>Highest week</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.fontMono, color: T.amber }}>${Math.max(...WEEKLY)}</div>
                  </div>
                  <div style={{ flex: 1, background: T.elevated, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>Weekly avg</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: T.fontMono, color: T.text }}>${avgWeekly}</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bar chart */}
            <Card style={{ padding: 16, marginTop: 12 }}>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
                Week-by-week breakdown
              </div>
              <SpendingChart data={WEEKLY} color={color} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontSize: 9, color: T.textDim, fontFamily: T.fontMono }}>W1</span>
                <span style={{ fontSize: 9, color: T.textDim, fontFamily: T.fontMono }}>W12</span>
              </div>
            </Card>
          </div>
        )}

        {/* AI insight */}
        <div style={{ padding: "0 16px 20px" }}>
          <div style={{
            borderRadius: 14, padding: 14, display: "flex", gap: 10,
            background: `linear-gradient(90deg, ${T.violet}18, ${T.teal}18)`,
            border: `1px solid ${T.violet}44`,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 9999, background: T.violet, display: "flex", alignItems: "center", justifyContent: "center", color: "#0A0A0F", flexShrink: 0 }}>
              <Icon name="sparkle" size={15} strokeWidth={2.4} />
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>
              Your {name.toLowerCase()} spend is trending <b style={{ color: T.amber }}>12% above</b> last month. Costco bulk buying saved ~$40 vs retail. Consider meal prepping to cut mid-week top-ups.
            </div>
          </div>
        </div>
      </PageScroll>
    </div>
  );
}
