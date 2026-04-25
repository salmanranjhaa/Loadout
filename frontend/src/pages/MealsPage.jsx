import { useState, useEffect } from "react";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";
import {
  PageHeader, PageScroll, Chip, Fab, Card,
  MacroBar, MacroRing, EmptyState, LoadingDots,
} from "../design/components";
import { mealsAPI, userAPI } from "../utils/api";
import MealDetailPage from "./details/MealDetailPage";

const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MEAL_GROUPS = ["Breakfast","Lunch","Dinner","Snacks"];
const DAY_NAMES_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function todayDOW() {
  // 0=Mon…6=Sun
  return (new Date().getDay() + 6) % 7;
}

function adherenceColor(pct) {
  if (pct >= 0.8) return T.teal;
  if (pct >= 0.5) return T.amber;
  return T.negative;
}

// ── Week adherence strip ──────────────────────────────────────────────────────
function WeekStrip({ history, calorieTarget }) {
  const todayIdx = todayDOW();

  // Build 7-slot array for Mon–Sun of the current week
  const slots = DAYS_SHORT.map((d, i) => {
    const date = new Date();
    const diff = i - todayIdx;
    date.setDate(date.getDate() + diff);
    const iso = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const bucket = history?.[iso];
    const kcal = bucket?.total_calories || 0;
    const pct = calorieTarget ? Math.min(kcal / calorieTarget, 1) : 0;
    return { d, i, iso, kcal, pct, hasData: !!bucket };
  });

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 52 }}>
      {slots.map(({ d, i, pct, hasData }) => {
        const isToday = i === todayIdx;
        const color = hasData ? adherenceColor(pct) : T.border;
        const barH = Math.max(pct * 36, hasData ? 4 : 2);
        return (
          <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
              <div style={{
                width: "100%",
                height: barH,
                background: color,
                borderRadius: 3,
                opacity: isToday ? 1 : 0.7,
                transition: "height 0.3s ease",
              }} />
            </div>
            <span style={{
              fontSize: 9,
              fontWeight: isToday ? 700 : 500,
              color: isToday ? T.teal : T.textDim,
              letterSpacing: 0.3,
              fontFamily: T.fontMono,
            }}>
              {d}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Supplement chip ───────────────────────────────────────────────────────────
function SupplementChip({ sup, checked, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px 6px 8px",
        borderRadius: 9999,
        border: `1px solid ${checked ? T.teal : T.border}`,
        background: checked ? `${T.teal}18` : T.elevated,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: 9999,
        border: `1.5px solid ${checked ? T.teal : T.textDim}`,
        background: checked ? T.teal : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        transition: "all 0.15s",
      }}>
        {checked && <Icon name="check" size={9} color="#0A0A0F" strokeWidth={2.5} />}
      </div>
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: checked ? T.teal : T.text, whiteSpace: "nowrap" }}>
          {sup.name}
        </div>
        {sup.dose && (
          <div style={{ fontSize: 9, color: T.textDim, fontFamily: T.fontMono }}>{sup.dose}</div>
        )}
      </div>
    </button>
  );
}

// ── Meal row inside a group ───────────────────────────────────────────────────
function MealRow({ meal, onDelete, deleting, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderBottom: `0.5px solid ${T.border}`,
        background: pressed ? T.elevated2 : "transparent",
        transition: "background 0.1s",
        cursor: "pointer",
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* Icon dot */}
      <div style={{
        width: 8, height: 8, borderRadius: 9999,
        background: T.amber, flexShrink: 0,
      }} />

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {meal.name}
        </div>
        <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono, marginTop: 1 }}>
          {Math.round(meal.protein_g || 0)}g P
          {meal.carbs_g ? ` · ${Math.round(meal.carbs_g)}g C` : ""}
          {meal.fat_g ? ` · ${Math.round(meal.fat_g)}g F` : ""}
        </div>
      </div>

      {/* Kcal */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.amber, fontFamily: T.fontMono }}>
          {Math.round(meal.calories || 0)}
        </div>
        <div style={{ fontSize: 9, color: T.textDim }}>kcal</div>
      </div>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(meal.id); }}
        disabled={deleting}
        style={{
          background: "none", border: "none", padding: 4, cursor: "pointer",
          color: T.textDim, borderRadius: 6, opacity: deleting ? 0.4 : 1,
          flexShrink: 0,
        }}
      >
        <Icon name="trash" size={13} color={T.textDim} />
      </button>
    </div>
  );
}

// ── Collapsible meal group ────────────────────────────────────────────────────
function MealGroup({ groupName, meals, onDelete, deletingId, onAddClick, onMealClick }) {
  const [open, setOpen] = useState(true);
  const total = meals.reduce((s, m) => s + (m.calories || 0), 0);

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Icon
          name={open ? "chev-down" : "chev-right"}
          size={14}
          color={T.textMuted}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", flex: 1 }}>
          {groupName}
        </span>
        {total > 0 && (
          <span style={{ fontSize: 11, color: T.amber, fontFamily: T.fontMono, fontWeight: 600 }}>
            {Math.round(total)} kcal
          </span>
        )}
        <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.fontMono }}>
          {meals.length} item{meals.length !== 1 ? "s" : ""}
        </span>
      </button>

      {/* Items */}
      {open && (
        <Card style={{ margin: "0 16px", padding: 0, overflow: "hidden" }}>
          {meals.length === 0 ? (
            <div style={{ padding: "12px 16px", fontSize: 12, color: T.textDim }}>
              Nothing logged yet
            </div>
          ) : (
            meals.map(m => (
              <MealRow
                key={m.id}
                meal={m}
                onDelete={onDelete}
                deleting={deletingId === m.id}
                onClick={() => onMealClick?.(m)}
              />
            ))
          )}
          {/* Add button */}
          <button
            onClick={() => onAddClick(groupName)}
            style={{
              width: "100%", padding: "10px 14px",
              background: "none",
              border: "none",
              borderTop: meals.length > 0 ? `1px dashed ${T.border}` : "none",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              color: T.textDim,
            }}
          >
            <Icon name="plus" size={13} color={T.textDim} />
            <span style={{ fontSize: 11, fontWeight: 500, fontFamily: T.fontFamily }}>
              Add to {groupName}
            </span>
          </button>
        </Card>
      )}
    </div>
  );
}

// ── Quick-add modal ───────────────────────────────────────────────────────────
function QuickAddModal({ groupName, templates, onLog, onClose, loggingId }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(10,10,15,0.88)",
        display: "flex", alignItems: "flex-end",
        backdropFilter: "blur(4px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%",
        background: T.surface,
        borderRadius: "20px 20px 0 0",
        border: `1px solid ${T.border}`,
        borderBottom: "none",
        padding: "20px 20px 44px",
        maxHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: T.border, alignSelf: "center", marginBottom: 4 }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>Add to {groupName}</div>
          <button
            onClick={onClose}
            style={{
              background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 9999,
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: T.textMuted,
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Template list */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {templates.length === 0 ? (
            <EmptyState icon="meal" title="No saved meals" subtitle="Use AI chat to generate meal templates" />
          ) : (
            templates.map(t => (
              <button
                key={t.id}
                onClick={() => onLog(t)}
                disabled={loggingId === t.id}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", marginBottom: 6,
                  background: T.elevated, border: `1px solid ${T.border}`,
                  borderRadius: 12, cursor: "pointer", textAlign: "left",
                  opacity: loggingId === t.id ? 0.5 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono, marginTop: 2 }}>
                    {Math.round(t.protein_g || 0)}g P
                    {t.carbs_g ? ` · ${Math.round(t.carbs_g)}g C` : ""}
                    {t.fat_g ? ` · ${Math.round(t.fat_g)}g F` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.amber, fontFamily: T.fontMono }}>
                    {Math.round(t.calories || 0)}
                  </div>
                  <div style={{ fontSize: 9, color: T.textDim }}>kcal</div>
                </div>
                {loggingId === t.id ? (
                  <LoadingDots />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: 9999, background: `${T.teal}20`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon name="plus" size={14} color={T.teal} />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MealsPage({ profile, onProfile }) {
  const [todayMeals, setTodayMeals] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [loggingId, setLoggingId] = useState(null);
  const [supplements, setSupplements] = useState([]);
  const [checkedSupplements, setCheckedSupplements] = useState({});
  const [addModal, setAddModal] = useState(null); // groupName | null
  const [targets, setTargets] = useState({ calories: 2100, protein: 190, carbs: 200, fat: 70 });
  const [selectedMeal, setSelectedMeal] = useState(null);

  // Derived
  const totalCals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const totalCarbs = todayMeals.reduce((s, m) => s + (m.carbs_g || 0), 0);
  const totalFat = todayMeals.reduce((s, m) => s + (m.fat_g || 0), 0);
  const calPct = totalCals / targets.calories;

  const todayDayName = DAY_NAMES_FULL[todayDOW()];
  const adherancePct = Math.round(calPct * 100);

  // Group meals by type
  const mealsByGroup = MEAL_GROUPS.reduce((acc, g) => {
    const key = g.toLowerCase();
    acc[g] = todayMeals.filter(m => {
      const t = (m.meal_type || "").toLowerCase();
      if (g === "Snacks") return t === "snack" || t === "snacks";
      return t === key;
    });
    return acc;
  }, {});

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [todayData, templatesData, historyData, profileData] = await Promise.allSettled([
          mealsAPI.getToday(),
          mealsAPI.getTemplates(),
          mealsAPI.getHistory(7),
          userAPI.getProfile(),
        ]);

        if (todayData.status === "fulfilled") setTodayMeals(todayData.value.meals || []);
        if (templatesData.status === "fulfilled") setTemplates(templatesData.value.templates || []);
        if (historyData.status === "fulfilled") setHistory(historyData.value.history || {});
        if (profileData.status === "fulfilled") {
          const p = profileData.value;
          setTargets({
            calories: p.daily_calorie_target || p.calorie_target || 2100,
            protein: p.daily_protein_target || p.protein_target || 190,
            carbs: p.daily_carb_target || p.carb_target || 200,
            fat: p.daily_fat_target || p.fat_target || 70,
          });
          if (Array.isArray(p.supplements)) {
            setSupplements(p.supplements);
          }
        }
      } catch {}
      setLoading(false);
    }
    loadAll();
  }, []);

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await mealsAPI.deleteLog(id);
      setTodayMeals(prev => prev.filter(m => m.id !== id));
    } catch {}
    setDeletingId(null);
  }

  async function handleLogTemplate(template) {
    setLoggingId(template.id);
    try {
      await mealsAPI.logMeal({
        meal_type: template.meal_type,
        template_id: template.id,
        name: template.name,
        calories: template.calories,
        protein_g: template.protein_g,
        carbs_g: template.carbs_g,
        fat_g: template.fat_g,
      });
      const data = await mealsAPI.getToday();
      setTodayMeals(data.meals || []);
      setAddModal(null);
    } catch (e) { alert(e.message || "Failed to log"); }
    setLoggingId(null);
  }

  function toggleSupplement(name) {
    setCheckedSupplements(prev => ({ ...prev, [name]: !prev[name] }));
  }

  if (loading) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg }}>
        <PageHeader title="Meals" subtitle="Loading…" profile={profile} onProfile={onProfile} />
        <LoadingDots />
      </div>
    );
  }

  // Default supplements if none from profile
  const displaySupplements = supplements.length > 0 ? supplements : [
    { name: "Magnesium", dose: "400mg" },
    { name: "Vitamin D", dose: "2000 IU" },
    { name: "Omega-3", dose: "1g" },
    { name: "Creatine", dose: "5g" },
    { name: "Whey Protein", dose: "30g" },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg }}>
      <PageHeader
        title="Meals"
        subtitle={`${todayDayName} · ${adherancePct}% of target`}
        profile={profile}
        onProfile={onProfile}
        trailing={
          <button
            style={{
              background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 9999,
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: T.textMuted, flexShrink: 0,
            }}
          >
            <Icon name="history" size={14} color={T.textMuted} />
          </button>
        }
      />

      <PageScroll padBottom={100}>
        {/* ── Hero macro card ──────────────────────────────────────────────── */}
        <div style={{ padding: "0 16px 14px" }}>
          <Card style={{ padding: 16, display: "flex", gap: 16, alignItems: "center" }}>
            {/* Ring */}
            <MacroRing pct={calPct} value={Math.round(totalCals)} target={targets.calories} />

            {/* Macro bars */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <MacroBar
                label="Protein"
                value={Math.round(totalProtein)}
                target={targets.protein}
                color={T.teal}
              />
              <MacroBar
                label="Carbs"
                value={Math.round(totalCarbs)}
                target={targets.carbs}
                color={T.amber}
              />
              <MacroBar
                label="Fat"
                value={Math.round(totalFat)}
                target={targets.fat}
                color={T.violet}
              />
            </div>
          </Card>
        </div>

        {/* ── Week adherence strip ──────────────────────────────────────────── */}
        <div style={{ padding: "0 16px 14px" }}>
          <Card style={{ padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10 }}>
              This week
            </div>
            <WeekStrip history={history} calorieTarget={targets.calories} />
          </Card>
        </div>

        {/* ── Supplement row ────────────────────────────────────────────────── */}
        {displaySupplements.length > 0 && (
          <div style={{ paddingBottom: 14 }}>
            <div style={{ padding: "0 16px 8px", fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.6, textTransform: "uppercase" }}>
              Supplements
            </div>
            <div style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              padding: "0 16px",
              scrollbarWidth: "none",
            }}>
              {displaySupplements.map((sup, i) => (
                <SupplementChip
                  key={i}
                  sup={sup}
                  checked={!!checkedSupplements[sup.name]}
                  onToggle={() => toggleSupplement(sup.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Meal groups ───────────────────────────────────────────────────── */}
        <div style={{ paddingBottom: 8 }}>
          <div style={{ padding: "0 16px 8px", fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.6, textTransform: "uppercase" }}>
            Today's meals
          </div>
          {MEAL_GROUPS.map(g => (
            <MealGroup
              key={g}
              groupName={g}
              meals={mealsByGroup[g] || []}
              onDelete={handleDelete}
              deletingId={deletingId}
              onAddClick={name => setAddModal(name)}
              onMealClick={m => setSelectedMeal(m)}
            />
          ))}
        </div>

        {/* ── Uncategorized / other ─────────────────────────────────────────── */}
        {(() => {
          const grouped = Object.values(mealsByGroup).flat().map(m => m.id);
          const other = todayMeals.filter(m => !grouped.includes(m.id));
          if (other.length === 0) return null;
          return (
            <MealGroup
              groupName="Other"
              meals={other}
              onDelete={handleDelete}
              deletingId={deletingId}
              onAddClick={name => setAddModal(name)}
              onMealClick={m => setSelectedMeal(m)}
            />
          );
        })()}
      </PageScroll>

      {/* FABs */}
      {/* Sparkle AI FAB */}
      <button
        style={{
          position: "absolute",
          right: 20,
          bottom: 160,
          zIndex: 20,
          width: 44,
          height: 44,
          borderRadius: 9999,
          background: T.elevated,
          border: `1px solid ${T.border}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.teal,
          boxShadow: `0 4px 12px rgba(0,0,0,0.4)`,
        }}
      >
        <Icon name="sparkle" size={18} color={T.teal} />
      </button>

      {/* Plus FAB */}
      <Fab
        onClick={() => setAddModal("Breakfast")}
        icon="plus"
        color={T.teal}
        bottom={100}
        right={20}
      />

      {/* Quick add modal */}
      {addModal && (
        <QuickAddModal
          groupName={addModal}
          templates={templates}
          onLog={handleLogTemplate}
          onClose={() => setAddModal(null)}
          loggingId={loggingId}
        />
      )}
      {selectedMeal && (
        <MealDetailPage
          meal={{
            food: selectedMeal.name,
            kcal: Math.round(selectedMeal.calories || 0),
            P: Math.round(selectedMeal.protein_g || 0),
            C: Math.round(selectedMeal.carbs_g || 0),
            F: Math.round(selectedMeal.fat_g || 0),
          }}
          onBack={() => setSelectedMeal(null)}
          onDelete={() => { handleDelete(selectedMeal.id); setSelectedMeal(null); }}
        />
      )}
    </div>
  );
}
