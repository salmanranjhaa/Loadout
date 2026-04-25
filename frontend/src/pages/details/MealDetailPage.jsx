import { T } from "../../design/tokens";
import { Icon } from "../../design/icons";
import { Card, DetailHeader, PageScroll, MacroBar, MacroRing, MiniStat } from "../../design/components";

export default function MealDetailPage({ meal = {}, onBack, onDelete }) {
  const { food = "Chicken + rice bowl", kcal = 680, P = 52, C = 62, F = 15 } = meal;

  const ingredients = [
    { name: "Chicken breast · grilled", qty: "220 g", kcal: 330, P: 62, C: 0, F: 8 },
    { name: "Basmati rice · cooked",   qty: "180 g", kcal: 234, P: 4, C: 50, F: 1 },
    { name: "Teriyaki sauce",           qty: "30 g",  kcal: 40,  P: 1, C: 9,  F: 0 },
    { name: "Spinach · wilted",         qty: "60 g",  kcal: 14,  P: 2, C: 2,  F: 0 },
    { name: "Avocado · 1/3",            qty: "50 g",  kcal: 62,  P: 1, C: 3,  F: 6 },
  ];

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
        title={food.length > 22 ? food.slice(0, 22) + "…" : food}
        subtitle="Lunch · 12:40"
        trailing={
          <button style={{ width: 34, height: 34, borderRadius: 9999, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Icon name="edit" size={15} />
          </button>
        }
      />

      <PageScroll padBottom={120}>
        {/* Photo placeholder */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{
            height: 160, borderRadius: 18, overflow: "hidden", position: "relative",
            background: `linear-gradient(135deg, ${T.amber}33, ${T.teal}22)`,
            border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg, transparent 0 8px, rgba(0,0,0,0.06) 8px 16px)" }} />
            <div style={{ position: "relative", textAlign: "center" }}>
              <Icon name="camera" size={28} color={T.textDim} />
              <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textMuted, marginTop: 6, letterSpacing: 0.3 }}>
                [ food photo · tap to replace ]
              </div>
              <div style={{ fontSize: 9, color: T.textDim, marginTop: 2, fontFamily: T.fontMono }}>
                logged via AI · 98% confidence
              </div>
            </div>
          </div>
        </div>

        {/* Macro summary */}
        <div style={{ padding: "0 16px 16px" }}>
          <Card style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <MacroRing pct={kcal / 2600} value={kcal} target={2600} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <MacroBar label="Protein" value={P}  target={200} color={T.teal}   unit="g" />
                <MacroBar label="Carbs"   value={C}  target={300} color={T.amber}  unit="g" />
                <MacroBar label="Fat"     value={F}  target={85}  color={T.violet} unit="g" />
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `0.5px solid ${T.border}`, display: "flex", gap: 8 }}>
              {[["Fiber","6g"],["Sugar","4g"],["Sodium","620mg"],["Satiety","8/10"]].map(([l, v]) => (
                <div key={l} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: T.fontMono, color: T.text }}>{v}</div>
                  <div style={{ fontSize: 9, color: T.textDim, letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 600, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Ingredients */}
        <div style={{ padding: "0 16px 18px" }}>
          <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: 600, marginBottom: 10, paddingLeft: 4 }}>Ingredients</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ingredients.map((ing, i) => (
              <Card key={i} style={{ padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{ing.name}</div>
                    <div style={{ fontSize: 10, fontFamily: T.fontMono, color: T.textDim, marginTop: 2, letterSpacing: 0.3 }}>
                      {ing.qty} · {ing.kcal} kcal · {ing.P}P {ing.C}C {ing.F}F
                    </div>
                  </div>
                  <Icon name="edit" size={14} color={T.textDim} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* AI coaching */}
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
              Lean on the protein here — <b style={{ color: T.text }}>{P}g</b> puts your day at {P + 142}g (target 200g). You've got headroom for carbs at dinner.
            </div>
          </div>
        </div>
      </PageScroll>

      {/* Sticky actions */}
      <div style={{ position: "absolute", left: 16, right: 16, bottom: 24, display: "flex", gap: 8, zIndex: 24 }}>
        <button onClick={onDelete} style={{ width: 52, height: 52, borderRadius: 14, background: T.elevated, border: `1px solid ${T.border}`, color: T.negative, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="trash" size={17} />
        </button>
        <button style={{ flex: 1, height: 52, borderRadius: 14, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          Duplicate
        </button>
        <button style={{ flex: 1, height: 52, borderRadius: 14, background: T.teal, border: "none", color: "#0A0A0F", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 10px 30px ${T.teal}55` }}>
          Save as template
        </button>
      </div>
    </div>
  );
}
