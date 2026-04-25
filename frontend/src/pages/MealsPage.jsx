import { useState, useEffect } from "react";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";
import {
  PageHeader, PageScroll, Chip, Fab, Card,
  MacroBar, MacroRing, EmptyState, LoadingDots,
} from "../design/components";
import { mealsAPI, userAPI, aiAPI } from "../utils/api";
import MealDetailPage from "./details/MealDetailPage";

const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MEAL_GROUPS = ["Breakfast","Lunch","Dinner","Snacks"];
const DAY_NAMES_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function todayDOW() { return (new Date().getDay() + 6) % 7; }
function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getTodayISO() { return toISO(new Date()); }

function adherenceColor(pct) {
  if (pct >= 0.8) return T.teal;
  if (pct >= 0.5) return T.amber;
  return T.negative;
}

function inp(focused) {
  return { width:"100%", background:T.elevated, border:`1px solid ${focused?T.teal:T.border}`, borderRadius:T.rInput, padding:"10px 12px", color:T.text, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
}

function WeekStrip({ history, calorieTarget, selectedDate, onSelectDate }) {
  const todayIdx = todayDOW();
  const slots = DAYS_SHORT.map((d, i) => {
    const date = new Date();
    date.setDate(date.getDate() + (i - todayIdx));
    const iso = toISO(date);
    const bucket = history?.[iso];
    const kcal = bucket?.total_calories || 0;
    const pct = calorieTarget ? Math.min(kcal / calorieTarget, 1) : 0;
    const isSelected = iso === selectedDate;
    const isFuture = date > new Date() && !isSelected;
    return { d, i, iso, pct, hasData:!!bucket, isSelected, isFuture };
  });
  return (
    <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:56 }}>
      {slots.map(({ d, i, iso, pct, hasData, isSelected, isFuture }) => {
        const isToday = i === todayIdx;
        const color = isSelected ? T.teal : (hasData ? adherenceColor(pct) : T.border);
        const barH = isSelected ? Math.max(pct * 36, 6) : Math.max(pct * 36, hasData ? 4 : 2);
        return (
          <div key={d} onClick={() => !isFuture && onSelectDate?.(iso)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:isFuture?"default":"pointer" }}>
            <div style={{ flex:1, display:"flex", alignItems:"flex-end", width:"100%" }}>
              <div style={{
                width:"100%", height:barH, background:color, borderRadius:3,
                opacity:isFuture?0.3:isToday||isSelected?1:0.7,
                transition:"all 0.25s ease",
                boxShadow:isSelected?`0 0 8px ${T.teal}66`:undefined,
              }} />
            </div>
            <span style={{ fontSize:9, fontWeight:isToday||isSelected?700:500, color:isSelected?T.teal:isToday?T.teal:T.textDim, letterSpacing:0.3, fontFamily:T.fontMono }}>
              {d}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DayNav({ selectedDate, onNav }) {
  const d = new Date(selectedDate + "T12:00:00");
  const dow = (d.getDay() + 6) % 7;
  const dayLabel = selectedDate === getTodayISO() ? "Today" : DAY_NAMES_FULL[dow];
  const dateStr = `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  const todayISO = getTodayISO();
  const isToday = selectedDate === todayISO;
  const isFuture = selectedDate > todayISO;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, padding:"2px 16px 10px" }}>
      <button onClick={() => onNav(-1)}
        style={{ width:32, height:32, borderRadius:9999, background:T.elevated, border:`1px solid ${T.border}`, color:T.text, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
        <Icon name="chev-left" size={15} />
      </button>
      <div style={{ flex:1, textAlign:"center" }}>
        <span style={{ fontSize:15, fontWeight:700, color:T.text }}>{dayLabel}</span>
        <span style={{ fontSize:13, color:T.textMuted, marginLeft:6 }}>{dateStr}</span>
        {isToday && <span style={{ marginLeft:6, fontSize:9, fontWeight:700, color:T.teal, background:`${T.teal}22`, padding:"2px 6px", borderRadius:6, verticalAlign:"middle" }}>NOW</span>}
      </div>
      <button onClick={() => !isFuture && onNav(1)}
        style={{ width:32, height:32, borderRadius:9999, background:T.elevated, border:`1px solid ${T.border}`, color:isFuture?T.textDim:T.text, display:"flex", alignItems:"center", justifyContent:"center", cursor:isFuture?"default":"pointer", flexShrink:0, opacity:isFuture?0.4:1 }}>
        <Icon name="chev-right" size={15} />
      </button>
    </div>
  );
}

function SupplementChip({ sup, checked, onToggle }) {
  return (
    <button onClick={onToggle}
      style={{ flexShrink:0, display:"flex", alignItems:"center", gap:6, padding:"6px 12px 6px 8px", borderRadius:9999, border:`1px solid ${checked?T.teal:T.border}`, background:checked?`${T.teal}18`:T.elevated, cursor:"pointer", transition:"all 0.15s" }}>
      <div style={{ width:16, height:16, borderRadius:9999, border:`1.5px solid ${checked?T.teal:T.textDim}`, background:checked?T.teal:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
        {checked && <Icon name="check" size={9} color="#0A0A0F" strokeWidth={2.5} />}
      </div>
      <div style={{ textAlign:"left" }}>
        <div style={{ fontSize:11, fontWeight:600, color:checked?T.teal:T.text, whiteSpace:"nowrap" }}>{sup.name}</div>
        {sup.dose && <div style={{ fontSize:9, color:T.textDim, fontFamily:T.fontMono }}>{sup.dose}</div>}
      </div>
    </button>
  );
}

function MealRow({ meal, onDelete, deleting, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div onClick={onClick}
      style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom:`0.5px solid ${T.border}`, background:pressed?T.elevated2:"transparent", transition:"background 0.1s", cursor:"pointer" }}
      onPointerDown={()=>setPressed(true)} onPointerUp={()=>setPressed(false)} onPointerLeave={()=>setPressed(false)}>
      <div style={{ width:8, height:8, borderRadius:9999, background:T.amber, flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:500, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{meal.name}</div>
        <div style={{ fontSize:10, color:T.textMuted, fontFamily:T.fontMono, marginTop:1 }}>
          {Math.round(meal.protein_g||0)}g P{meal.carbs_g?` · ${Math.round(meal.carbs_g)}g C`:""}
          {meal.fat_g?` · ${Math.round(meal.fat_g)}g F`:""}
        </div>
      </div>
      <div style={{ textAlign:"right", flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.amber, fontFamily:T.fontMono }}>{Math.round(meal.calories||0)}</div>
        <div style={{ fontSize:9, color:T.textDim }}>kcal</div>
      </div>
      <button onClick={e=>{ e.stopPropagation(); onDelete(meal.id); }} disabled={deleting}
        style={{ background:"none", border:"none", padding:4, cursor:"pointer", color:T.textDim, borderRadius:6, opacity:deleting?0.4:1, flexShrink:0 }}>
        <Icon name="trash" size={13} color={T.textDim} />
      </button>
    </div>
  );
}

function MealGroup({ groupName, meals, onDelete, deletingId, onAddClick, onMealClick }) {
  const [open, setOpen] = useState(true);
  const total = meals.reduce((s,m)=>s+(m.calories||0),0);
  return (
    <div style={{ marginBottom:8 }}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"10px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
        <Icon name={open?"chev-down":"chev-right"} size={14} color={T.textMuted} />
        <span style={{ fontSize:12, fontWeight:700, color:T.textMuted, letterSpacing:0.5, textTransform:"uppercase", flex:1 }}>{groupName}</span>
        {total>0 && <span style={{ fontSize:11, color:T.amber, fontFamily:T.fontMono, fontWeight:600 }}>{Math.round(total)} kcal</span>}
        <span style={{ fontSize:11, color:T.textDim, fontFamily:T.fontMono }}>{meals.length} item{meals.length!==1?"s":""}</span>
      </button>
      {open && (
        <Card style={{ margin:"0 16px", padding:0, overflow:"hidden" }}>
          {meals.length===0
            ? <div style={{ padding:"12px 16px", fontSize:12, color:T.textDim }}>Nothing logged yet</div>
            : meals.map(m=>(
              <MealRow key={m.id} meal={m} onDelete={onDelete} deleting={deletingId===m.id} onClick={()=>onMealClick?.(m)} />
            ))
          }
          <button onClick={()=>onAddClick(groupName)}
            style={{ width:"100%", padding:"10px 14px", background:"none", border:"none", borderTop:meals.length>0?`1px dashed ${T.border}`:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:T.textDim }}>
            <Icon name="plus" size={13} color={T.textDim} />
            <span style={{ fontSize:11, fontWeight:500, fontFamily:T.fontFamily }}>Add to {groupName}</span>
          </button>
        </Card>
      )}
    </div>
  );
}

// ── AddMealSheet ─────────────────────────────────────────────────────────────
function AddMealSheet({ groupName, templates, onRefresh, onClose }) {
  const [mode, setMode] = useState(null); // null | "ai" | "select" | "manual"
  const MEAL_TYPES = ["breakfast","lunch","dinner","snack"];
  const mealType = (groupName||"breakfast").toLowerCase().replace("snacks","snack");

  // AI describe mode
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiName, setAiName] = useState(""); const [aiMealType, setAiMealType] = useState(mealType);
  const [aiLogging, setAiLogging] = useState(false);
  const [focusAi, setFocusAi] = useState(false);

  // Select mode
  const [search, setSearch] = useState("");
  const [loggingId, setLoggingId] = useState(null);
  const filtered = templates.filter(t=>t.name?.toLowerCase().includes(search.toLowerCase()));

  // Manual mode
  const [mName, setMName] = useState(""); const [mMealType, setMMealType] = useState(mealType);
  const [mCal, setMCal] = useState(""); const [mProt, setMProt] = useState("");
  const [mCarb, setMCarb] = useState(""); const [mFat, setMFat] = useState("");
  const [mSaveTemplate, setMSaveTemplate] = useState(false);
  const [mLogging, setMLogging] = useState(false);

  async function handleAIEstimate() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const r = await aiAPI.estimateMacros(aiText);
      setAiResult(r); setAiName(r.name||aiText.slice(0,40));
    } catch(e) { alert(e.message||"Estimate failed"); }
    setAiLoading(false);
  }

  async function handleAILog() {
    if (!aiResult) return;
    setAiLogging(true);
    try {
      await mealsAPI.logMeal({
        name: aiName || aiText.slice(0, 60),
        meal_type: aiMealType,
        calories: aiResult.calories || 0,
        protein_g: aiResult.protein_g || 0,
        carbs_g: aiResult.carbs_g || 0,
        fat_g: aiResult.fat_g || 0,
      });
      onRefresh?.(); onClose();
    } catch(e) { alert(e.message || "Log failed"); }
    setAiLogging(false);
  }

  async function handleSelectTemplate(t) {
    setLoggingId(t.id);
    try {
      await mealsAPI.logMeal({ template_id:t.id, meal_type:mealType });
      onRefresh?.(); onClose();
    } catch(e) { alert(e.message||"Log failed"); }
    setLoggingId(null);
  }

  async function handleManualLog() {
    if (!mName.trim()) return;
    setMLogging(true);
    try {
      const payload = { name:mName, meal_type:mMealType, calories:Number(mCal)||0, protein_g:Number(mProt)||0, carbs_g:Number(mCarb)||0, fat_g:Number(mFat)||0 };
      await mealsAPI.logMeal(payload);
      if (mSaveTemplate) await mealsAPI.saveTemplate(payload);
      onRefresh?.(); onClose();
    } catch(e) { alert(e.message||"Log failed"); }
    setMLogging(false);
  }

  const optionCards = [
    { key:"ai", icon:"sparkle", label:"Describe to AI", desc:"Type what you ate, AI estimates macros", color:T.teal },
    { key:"select", icon:"list", label:"Select saved meal", desc:"Pick from your meal library", color:T.amber },
    { key:"manual", icon:"edit", label:"Add manually", desc:"Enter name and macros yourself", color:T.violet },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(10,10,15,0.88)", display:"flex", alignItems:"flex-end", backdropFilter:"blur(4px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%", background:T.surface, borderRadius:"20px 20px 0 0", border:`1px solid ${T.border}`, borderBottom:"none", padding:"20px 20px 48px", maxHeight:"90vh", display:"flex", flexDirection:"column", gap:14, overflowY:"auto" }}>
        <div style={{ width:36, height:4, borderRadius:9999, background:T.border, alignSelf:"center", marginBottom:4 }} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:17, fontWeight:700, color:T.text }}>{mode ? optionCards.find(o=>o.key===mode)?.label : `Add to ${groupName}`}</div>
          <button onClick={mode?()=>setMode(null):onClose} style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:9999, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:T.textMuted }}>
            <Icon name={mode?"chev-left":"x"} size={14} />
          </button>
        </div>

        {!mode && optionCards.map(o=>(
          <button key={o.key} onClick={()=>setMode(o.key)}
            style={{ display:"flex", alignItems:"center", gap:14, padding:"16px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:T.rCard, cursor:"pointer", textAlign:"left" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:o.color+"18", border:`1px solid ${o.color}33`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name={o.icon} size={20} color={o.color} />
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:T.text }}>{o.label}</div>
              <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{o.desc}</div>
            </div>
            <Icon name="chev-right" size={14} color={T.textDim} style={{ marginLeft:"auto", flexShrink:0 }} />
          </button>
        ))}

        {mode==="ai" && (
          <>
            <textarea value={aiText} onChange={e=>setAiText(e.target.value)} onFocus={()=>setFocusAi(true)} onBlur={()=>setFocusAi(false)}
              placeholder="e.g. 200g chicken breast with rice and broccoli" rows={3}
              style={{ ...inp(focusAi), resize:"none" }} />
            {!aiResult && (
              <button onClick={handleAIEstimate} disabled={aiLoading||!aiText.trim()}
                style={{ padding:"13px 0", background:aiLoading?T.elevated:`linear-gradient(135deg,${T.teal},${T.violet})`, color:aiLoading?T.textMuted:"#0A0A0F", border:"none", borderRadius:T.rCard, fontSize:14, fontWeight:700, cursor:aiLoading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <Icon name="sparkle" size={16} color={aiLoading?T.textMuted:"#0A0A0F"} />
                {aiLoading?"Estimating…":"Estimate Macros"}
              </button>
            )}
            {aiResult && (
              <div style={{ background:T.elevated, border:`1px solid ${T.teal}44`, borderRadius:T.rCard, padding:16, display:"flex", flexDirection:"column", gap:12 }}>
                <input value={aiName} onChange={e=>setAiName(e.target.value)} placeholder="Meal name" style={inp(false)} />
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {MEAL_TYPES.map(mt=>(
                    <button key={mt} onClick={()=>setAiMealType(mt)}
                      style={{ flex:1, padding:"6px 4px", borderRadius:T.rChip, background:aiMealType===mt?T.teal:T.surface, color:aiMealType===mt?"#0A0A0F":T.text, border:`1px solid ${aiMealType===mt?T.teal:T.border}`, fontSize:11, fontWeight:aiMealType===mt?700:500, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
                      {mt}
                    </button>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                  {[["Cal",aiResult.calories,T.amber],["P",aiResult.protein_g,T.teal],["C",aiResult.carbs_g,T.amber],["F",aiResult.fat_g,T.textMuted]].map(([l,v,c])=>(
                    <div key={l} style={{ background:T.surface, borderRadius:8, padding:"8px", textAlign:"center" }}>
                      <div style={{ fontSize:9, color:T.textDim, textTransform:"uppercase", letterSpacing:0.5 }}>{l}</div>
                      <div style={{ fontSize:15, fontWeight:700, color:c, fontFamily:T.fontMono }}>{Math.round(v||0)}</div>
                    </div>
                  ))}
                </div>
                <button onClick={handleAILog} disabled={aiLogging}
                  style={{ padding:"12px 0", background:T.teal, color:"#0A0A0F", border:"none", borderRadius:T.rCard, fontSize:14, fontWeight:700, cursor:aiLogging?"not-allowed":"pointer", fontFamily:"inherit" }}>
                  {aiLogging?"Logging…":"Log it"}
                </button>
              </div>
            )}
          </>
        )}

        {mode==="select" && (
          <>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search meals…" style={inp(false)} />
            <div style={{ display:"flex", flexDirection:"column", gap:6, overflowY:"auto", maxHeight:320 }}>
              {filtered.length===0
                ? <EmptyState icon="meal" title="No saved meals" subtitle="Use AI chat to generate meal templates" />
                : filtered.map(t=>(
                  <button key={t.id} onClick={()=>handleSelectTemplate(t)} disabled={loggingId===t.id}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:12, cursor:"pointer", textAlign:"left", opacity:loggingId===t.id?0.5:1 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.name}</div>
                      <div style={{ fontSize:10, color:T.textMuted, fontFamily:T.fontMono, marginTop:2 }}>{Math.round(t.protein_g||0)}g P{t.carbs_g?` · ${Math.round(t.carbs_g)}g C`:""}{t.fat_g?` · ${Math.round(t.fat_g)}g F`:""}</div>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:T.amber, fontFamily:T.fontMono }}>{Math.round(t.calories||0)}</div>
                      <div style={{ fontSize:9, color:T.textDim }}>kcal</div>
                    </div>
                    <div style={{ width:28, height:28, borderRadius:9999, background:`${T.teal}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon name="plus" size={14} color={T.teal} />
                    </div>
                  </button>
                ))}
            </div>
          </>
        )}

        {mode==="manual" && (
          <>
            <input value={mName} onChange={e=>setMName(e.target.value)} placeholder="Meal name" style={inp(false)} />
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {MEAL_TYPES.map(mt=>(
                <button key={mt} onClick={()=>setMMealType(mt)}
                  style={{ flex:1, padding:"7px 4px", borderRadius:T.rChip, background:mMealType===mt?T.violet:T.elevated, color:mMealType===mt?"#fff":T.text, border:`1px solid ${mMealType===mt?T.violet:T.border}`, fontSize:11, fontWeight:mMealType===mt?700:500, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
                  {mt}
                </button>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["Calories (kcal)",mCal,setMCal],["Protein (g)",mProt,setMProt],["Carbs (g)",mCarb,setMCarb],["Fat (g)",mFat,setMFat]].map(([label,val,setter])=>(
                <div key={label}>
                  <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>{label}</div>
                  <input type="number" value={val} onChange={e=>setter(e.target.value)} min={0} style={inp(false)} />
                </div>
              ))}
            </div>
            <button onClick={()=>setMSaveTemplate(v=>!v)}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:mSaveTemplate?T.violet+"18":T.elevated, border:`1px solid ${mSaveTemplate?T.violet:T.border}`, borderRadius:T.rCard, cursor:"pointer" }}>
              <div style={{ width:18, height:18, borderRadius:5, border:`1.5px solid ${mSaveTemplate?T.violet:T.textDim}`, background:mSaveTemplate?T.violet:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {mSaveTemplate && <Icon name="check" size={10} color="#fff" strokeWidth={2.5} />}
              </div>
              <span style={{ fontSize:13, color:T.text }}>Save as template</span>
            </button>
            <button onClick={handleManualLog} disabled={mLogging||!mName.trim()}
              style={{ padding:"13px 0", background:mLogging||!mName.trim()?T.elevated:T.violet, color:mLogging||!mName.trim()?T.textMuted:"#fff", border:"none", borderRadius:T.rCard, fontSize:14, fontWeight:700, cursor:mLogging||!mName.trim()?"not-allowed":"pointer", fontFamily:"inherit" }}>
              {mLogging?"Logging…":"Log Meal"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MealsPage({ profile, onProfile }) {
  const [todayMeals, setTodayMeals] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [supplements, setSupplements] = useState([]);
  const [checkedSupplements, setCheckedSupplements] = useState({});
  const [addModal, setAddModal] = useState(null);
  const [targets, setTargets] = useState({ calories:2100, protein:190, carbs:200, fat:70 });
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayISO);

  const todayISO = getTodayISO();
  const isToday = selectedDate === todayISO;

  // Meals for the selected date
  const activeMeals = isToday ? todayMeals : (history[selectedDate]?.meals || []);

  const totalCals = activeMeals.reduce((s,m)=>s+(m.calories||0),0);
  const totalProtein = activeMeals.reduce((s,m)=>s+(m.protein_g||0),0);
  const totalCarbs = activeMeals.reduce((s,m)=>s+(m.carbs_g||0),0);
  const totalFat = activeMeals.reduce((s,m)=>s+(m.fat_g||0),0);
  const calPct = totalCals / targets.calories;
  const adherancePct = Math.round(calPct * 100);

  const mealsByGroup = MEAL_GROUPS.reduce((acc,g) => {
    const key = g.toLowerCase();
    acc[g] = activeMeals.filter(m => {
      const t = (m.meal_type||"").toLowerCase();
      if (g==="Snacks") return t==="snack"||t==="snacks";
      return t===key;
    });
    return acc;
  }, {});

  async function loadAll() {
    setLoading(true);
    try {
      const [todayData, templatesData, historyData, profileData] = await Promise.allSettled([
        mealsAPI.getToday(), mealsAPI.getTemplates(), mealsAPI.getHistory(14), userAPI.getProfile(),
      ]);
      if (todayData.status==="fulfilled") setTodayMeals(todayData.value.meals||[]);
      if (templatesData.status==="fulfilled") setTemplates(templatesData.value.templates||[]);
      if (historyData.status==="fulfilled") setHistory(historyData.value.history||{});
      if (profileData.status==="fulfilled") {
        const p = profileData.value;
        setTargets({ calories:p.daily_calorie_target||p.calorie_target||2100, protein:p.daily_protein_target||p.protein_target||190, carbs:p.daily_carb_target||p.carb_target||200, fat:p.daily_fat_target||p.fat_target||70 });
        if (Array.isArray(p.supplements)) setSupplements(p.supplements);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(()=>{ loadAll(); }, []);

  function navigateDay(delta) {
    setSelectedDate(prev => {
      const d = new Date(prev + "T12:00:00");
      d.setDate(d.getDate() + delta);
      const next = toISO(d);
      if (next > todayISO) return prev; // don't go to future
      return next;
    });
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await mealsAPI.deleteLog(id);
      if (isToday) {
        setTodayMeals(prev => prev.filter(m => m.id !== id));
      } else {
        setHistory(prev => {
          const bucket = prev[selectedDate];
          if (!bucket) return prev;
          return { ...prev, [selectedDate]: { ...bucket, meals: bucket.meals.filter(m => m.id !== id) } };
        });
      }
    } catch {}
    setDeletingId(null);
  }

  async function handleUpdateMeal(id, updates) {
    try {
      const updated = await mealsAPI.updateLog(id, updates);
      if (isToday) {
        setTodayMeals(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
      } else {
        setHistory(prev => {
          const bucket = prev[selectedDate];
          if (!bucket) return prev;
          return { ...prev, [selectedDate]: { ...bucket, meals: bucket.meals.map(m => m.id === id ? { ...m, ...updated } : m) } };
        });
      }
      setSelectedMeal(prev => prev?.id === id ? { ...prev, ...updated } : prev);
    } catch(e) { alert("Update failed: " + (e.message||"Unknown error")); }
  }

  function toggleSupplement(name) { setCheckedSupplements(prev=>({...prev,[name]:!prev[name]})); }

  if (loading) {
    return (
      <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden", background:T.bg }}>
        <PageHeader title="Meals" subtitle="Loading…" profile={profile} onProfile={onProfile} />
        <LoadingDots />
      </div>
    );
  }

  const displaySupplements = supplements.length>0 ? supplements : [
    { name:"Magnesium", dose:"400mg" }, { name:"Vitamin D", dose:"2000 IU" },
    { name:"Omega-3", dose:"1g" }, { name:"Creatine", dose:"5g" }, { name:"Whey Protein", dose:"30g" },
  ];

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden", background:T.bg }}>
      <PageHeader
        title="Meals" subtitle={`${adherancePct}% of target`}
        profile={profile} onProfile={onProfile}
      />

      <PageScroll padBottom={100}>
        {/* Day navigation */}
        <DayNav selectedDate={selectedDate} onNav={navigateDay} />

        {/* Macro card */}
        <div style={{ padding:"0 16px 14px" }}>
          <Card style={{ padding:16, display:"flex", gap:16, alignItems:"center" }}>
            <MacroRing pct={calPct} value={Math.round(totalCals)} target={targets.calories} />
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
              <MacroBar label="Protein" value={Math.round(totalProtein)} target={targets.protein} color={T.teal} />
              <MacroBar label="Carbs" value={Math.round(totalCarbs)} target={targets.carbs} color={T.amber} />
              <MacroBar label="Fat" value={Math.round(totalFat)} target={targets.fat} color={T.violet} />
            </div>
          </Card>
        </div>

        {/* Week strip - clickable */}
        <div style={{ padding:"0 16px 14px" }}>
          <Card style={{ padding:"12px 14px" }}>
            <div style={{ fontSize:10, fontWeight:600, color:T.textMuted, letterSpacing:0.6, textTransform:"uppercase", marginBottom:10 }}>This week</div>
            <WeekStrip history={history} calorieTarget={targets.calories} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </Card>
        </div>

        {/* Supplements (today only) */}
        {isToday && displaySupplements.length>0 && (
          <div style={{ paddingBottom:14 }}>
            <div style={{ padding:"0 16px 8px", fontSize:10, fontWeight:600, color:T.textMuted, letterSpacing:0.6, textTransform:"uppercase" }}>Supplements</div>
            <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 16px", scrollbarWidth:"none" }}>
              {displaySupplements.map((sup,i)=>(
                <SupplementChip key={i} sup={sup} checked={!!checkedSupplements[sup.name]} onToggle={()=>toggleSupplement(sup.name)} />
              ))}
            </div>
          </div>
        )}

        {/* Meal groups for selected day */}
        <div style={{ paddingBottom:8 }}>
          <div style={{ padding:"0 16px 8px", fontSize:10, fontWeight:600, color:T.textMuted, letterSpacing:0.6, textTransform:"uppercase" }}>
            {isToday ? "Today's meals" : "Meals logged"}
          </div>
          {MEAL_GROUPS.map(g=>(
            <MealGroup key={g} groupName={g} meals={mealsByGroup[g]||[]} onDelete={handleDelete} deletingId={deletingId}
              onAddClick={isToday ? name=>setAddModal(name) : ()=>{}}
              onMealClick={m=>setSelectedMeal(m)} />
          ))}
          {(()=>{
            const grouped = Object.values(mealsByGroup).flat().map(m=>m.id);
            const other = activeMeals.filter(m=>!grouped.includes(m.id));
            if (!other.length) return null;
            return <MealGroup groupName="Other" meals={other} onDelete={handleDelete} deletingId={deletingId} onAddClick={()=>{}} onMealClick={m=>setSelectedMeal(m)} />;
          })()}
          {activeMeals.length === 0 && (
            <div style={{ padding:"32px 20px", textAlign:"center", color:T.textDim, fontSize:13 }}>
              No meals logged {isToday ? "today" : "this day"}
            </div>
          )}
        </div>
      </PageScroll>

      {isToday && <Fab onClick={()=>setAddModal("Breakfast")} icon="plus" color={T.teal} bottom={100} right={20} />}

      {addModal && (
        <AddMealSheet groupName={addModal} templates={templates} onRefresh={loadAll} onClose={()=>setAddModal(null)} />
      )}
      {selectedMeal && (
        <MealDetailPage
          meal={selectedMeal}
          targets={targets}
          onBack={()=>setSelectedMeal(null)}
          onDelete={()=>{ handleDelete(selectedMeal.id); setSelectedMeal(null); }}
          onUpdate={(updates)=>handleUpdateMeal(selectedMeal.id, updates)}
          onSaveAsTemplate={async()=>{
            try {
              await mealsAPI.saveTemplate({
                name:selectedMeal.name, meal_type:selectedMeal.meal_type||"lunch",
                calories:selectedMeal.calories, protein_g:selectedMeal.protein_g,
                carbs_g:selectedMeal.carbs_g, fat_g:selectedMeal.fat_g,
              });
              alert("Saved as template!");
            } catch(e) { alert("Failed: " + e.message); }
          }}
        />
      )}
    </div>
  );
}
