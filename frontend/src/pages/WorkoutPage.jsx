import { useState, useEffect, useRef } from "react";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";
import { Card, Chip, PageHeader, PageScroll, SectionHead, EmptyState, LoadingDots } from "../design/components";
import { workoutAPI } from "../utils/api";
import TemplateDetailPage from "./details/TemplateDetailPage";
import WorkoutLogPage from "./details/WorkoutLogPage";

// Shared exercise library (mirrors WorkoutLogPage for autocomplete)
const EXERCISE_DB = [
  "Bench Press","Incline Bench Press","Decline Bench Press","Incline DB Press","Flat DB Press","Cable Fly (High to Low)","Cable Fly (Low to High)","Pec Deck","Chest Press Machine","Weighted Dips","Push-ups",
  "Deadlift","Romanian Deadlift","Sumo Deadlift","Rack Pull","Pull-ups","Weighted Pull-ups","Chin-ups","Bent-over Barbell Row","One-arm DB Row","Lat Pulldown","Seated Cable Row","T-Bar Row","Face Pull","Machine Row",
  "Overhead Press (Barbell)","DB Shoulder Press","Seated DB Press","Arnold Press","Lateral Raise","Cable Lateral Raise","Front Raise","Rear Delt Fly","Upright Row","Machine Shoulder Press",
  "Barbell Curl","EZ-Bar Curl","DB Curl","Hammer Curl","Incline DB Curl","Concentration Curl","Spider Curl","Cable Curl","Preacher Curl","Reverse Curl",
  "Close Grip Bench Press","Skull Crusher (EZ-Bar)","Skull Crusher (DB)","Tricep Pushdown (Rope)","Tricep Pushdown (Bar)","Overhead Tricep Extension","Cable Overhead Extension","Dips (Tricep)","Diamond Push-ups","Kickbacks",
  "Back Squat","Front Squat","Goblet Squat","Bulgarian Split Squat","Leg Press","Hack Squat","Leg Extension","Seated Leg Curl","Lying Leg Curl","Hip Thrust","Walking Lunges","Reverse Lunges","Calf Raise (Standing)","Calf Raise (Seated)","Step-ups","Good Mornings","Glute Kickback",
  "Plank","Side Plank","Hanging Leg Raise","Ab Wheel Rollout","Cable Crunch","Russian Twist","Dead Bug","Hollow Body Hold","V-ups","Pallof Press",
  "Ski Erg","Sled Push","Sled Pull","Burpee Broad Jump","Wall Ball","Sandbag Lunges","Rowing Machine","Assault Bike","Box Jump","Kettlebell Swing","Battle Rope","Farmer's Carry","Double Unders","Tuck Jump",
];

const SPORTS_BROWSER = [
  { id:"all", label:"All" }, { id:"crossfit", label:"CrossFit" },
  { id:"running", label:"Running" }, { id:"strength", label:"Strength" },
  { id:"hyrox", label:"Hyrox" }, { id:"yoga", label:"Yoga" },
];

const SPORTS = [
  { id:"crossfit", label:"CrossFit", icon:"flame" }, { id:"running", label:"Running", icon:"run" },
  { id:"cycling", label:"Cycling", icon:"bike" }, { id:"hyrox", label:"Hyrox", icon:"bolt" },
  { id:"lifting", label:"Lifting", icon:"dumbbell" },
];

const BROWSER_TEMPLATES = [
  { id:"bt1", tag:"STRENGTH", tagColor:T.teal, name:"Push Day", exercises:["Bench Press","OHP","Tricep Dips"], duration:"60–75 min", muscles:["Chest","Triceps","Shoulders"], workout_type:"strength" },
  { id:"bt2", tag:"HYROX", tagColor:T.violet, name:"Hyrox Sim", exercises:["SkiErg","Sled Push","Burpee BJ"], duration:"75–90 min", muscles:["Full Body","Cardio"], workout_type:"hyrox" },
  { id:"bt3", tag:"STRENGTH", tagColor:T.teal, name:"Pull Day", exercises:["Deadlift","Pull-ups","Rows"], duration:"55–70 min", muscles:["Back","Biceps"], workout_type:"strength" },
  { id:"bt4", tag:"RUNNING", tagColor:T.amber, name:"Zone 2 Run", exercises:["Easy Run"], duration:"40–50 min", muscles:["Legs","Cardio"], workout_type:"running" },
  { id:"bt5", tag:"CROSSFIT", tagColor:T.negative, name:"Fran", exercises:["Thrusters","Pull-ups"], duration:"20–30 min", muscles:["Full Body"], workout_type:"crossfit" },
  { id:"bt6", tag:"YOGA", tagColor:T.violet, name:"Morning Flow", exercises:["Sun Salutation","Warrior","Downdog"], duration:"30–40 min", muscles:["Flexibility","Core"], workout_type:"yoga" },
];

const MOCK_TEMPLATES = [
  { id:"t1", tag:"STRENGTH", tagColor:T.teal, name:"Push Day", exercises:7, duration:"60–75 min", muscles:["Chest","Triceps","Shoulders"], workout_type:"strength" },
  { id:"t2", tag:"HYROX", tagColor:T.violet, name:"Hyrox Sim", exercises:8, duration:"75–90 min", muscles:["Full Body","Cardio"], workout_type:"hyrox" },
  { id:"t3", tag:"STRENGTH", tagColor:T.teal, name:"Pull Day", exercises:6, duration:"55–70 min", muscles:["Back","Biceps"], workout_type:"strength" },
  { id:"t4", tag:"CARDIO", tagColor:T.amber, name:"Zone 2 Run", exercises:1, duration:"40–50 min", muscles:["Legs","Cardio"], workout_type:"running" },
];

const MOCK_HISTORY = [
  { id:"h1", workout_type:"strength", date:"2025-04-22", duration_minutes:68, calories_burned_est:420, intensity:"high", name:"Push Day" },
  { id:"h2", workout_type:"running", date:"2025-04-20", duration_minutes:45, calories_burned_est:380, intensity:"moderate", name:"Zone 2" },
  { id:"h3", workout_type:"hyrox", date:"2025-04-18", duration_minutes:82, calories_burned_est:610, intensity:"high", name:"Hyrox Sim" },
];

const INTENSITY_COLORS = { high:T.negative, moderate:T.amber, low:T.teal, light:T.teal, intense:T.negative };
const WORKOUT_TYPES = ["strength","crossfit","running","hiit","hyrox","yoga","cycling"];
const INTENSITY_OPTS = ["light","moderate","intense"];

function inp(focused) {
  return { width:"100%", background:T.elevated, border:`1px solid ${focused?T.teal:T.border}`, borderRadius:T.rInput, padding:"10px 12px", color:T.text, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
}

function Sheet({ title, onClose, children, fullscreen }) {
  const inner = fullscreen
    ? { width:"100%", height:"100%", background:T.bg, display:"flex", flexDirection:"column", overflow:"hidden" }
    : { width:"100%", background:T.surface, borderRadius:"20px 20px 0 0", border:`1px solid ${T.border}`, borderBottom:"none", padding:"20px 20px 48px", maxHeight:"92vh", display:"flex", flexDirection:"column", gap:14, overflowY:"auto" };
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(10,10,15,0.88)", display:"flex", alignItems:fullscreen?"stretch":"flex-end", backdropFilter:"blur(4px)" }}
      onClick={e => { if (!fullscreen && e.target===e.currentTarget) onClose(); }}>
      <div style={inner}>
        {!fullscreen && <div style={{ width:36, height:4, borderRadius:9999, background:T.border, alignSelf:"center", marginBottom:4 }} />}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:fullscreen?"16px 20px":undefined, borderBottom:fullscreen?`1px solid ${T.border}`:undefined, flexShrink:0 }}>
          <div style={{ fontSize:fullscreen?20:17, fontWeight:700, color:T.text }}>{title}</div>
          <button onClick={onClose} style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:9999, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:T.textMuted }}>
            <Icon name="x" size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function IntensityBadge({ level }) {
  const color = INTENSITY_COLORS[level]||T.textMuted;
  return <span style={{ fontSize:10, fontWeight:600, color, background:color+"22", padding:"2px 8px", borderRadius:6, textTransform:"capitalize", letterSpacing:0.3 }}>{level}</span>;
}

function HeroCard({ onStart, onBrowse }) {
  return (
    <div style={{ margin:"0 20px 20px", borderRadius:T.rCard, background:`linear-gradient(135deg,${T.teal}1A,${T.violet}33)`, border:`1px solid ${T.teal}33`, padding:20, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:`radial-gradient(circle,${T.violet}44,transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ fontSize:10, fontFamily:T.fontMono, color:T.teal, letterSpacing:1.4, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Today's suggestion</div>
      <div style={{ fontSize:23, fontWeight:800, color:T.text, letterSpacing:-0.6, marginBottom:4, lineHeight:1.15 }}>Push Day · Chest + Tri</div>
      <div style={{ fontSize:12, color:T.textMuted, marginBottom:20 }}>7 exercises · 60–75 min · last done 4d ago</div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onStart} style={{ flex:1, padding:"11px 0", background:T.teal, color:"#0A0A0F", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Start Suggested</button>
        <button onClick={onBrowse} style={{ flex:1, padding:"11px 0", background:"transparent", color:T.text, border:`1px solid ${T.border}`, borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Browse Templates</button>
      </div>
    </div>
  );
}

function TemplateCardSmall({ t, onStart }) {
  return (
    <div style={{ width:220, flexShrink:0, background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.rCard, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
      <span style={{ alignSelf:"flex-start", fontSize:10, fontWeight:700, letterSpacing:0.8, color:t.tagColor, background:t.tagColor+"22", padding:"3px 8px", borderRadius:6 }}>{t.tag}</span>
      <div style={{ fontSize:17, fontWeight:700, color:T.text }}>{t.name}</div>
      <div style={{ fontSize:12, color:T.textMuted }}>{t.exercises} exercises · {t.duration}</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
        {(t.muscles||[]).map(m=><span key={m} style={{ fontSize:10, color:T.textMuted, background:T.elevated, border:`1px solid ${T.border}`, borderRadius:6, padding:"2px 7px" }}>{m}</span>)}
      </div>
      <button onClick={()=>onStart(t)} style={{ marginTop:"auto", padding:"8px 0", background:T.teal+"22", color:T.teal, border:`1px solid ${T.teal}44`, borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Start</button>
    </div>
  );
}

function HistoryCard({ w, onClick }) {
  const type=w.workout_type||w.type||"strength";
  const borderColor=type==="hyrox"?T.violet:type==="strength"?T.teal:T.amber;
  const iconName=type==="strength"?"dumbbell":type==="hyrox"?"bolt":"run";
  return (
    <div onClick={onClick} style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${borderColor}`, borderRadius:T.rCard, padding:"14px 16px", cursor:"pointer", display:"flex", gap:12 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:borderColor+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <Icon name={iconName} size={18} color={borderColor} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ fontSize:14, fontWeight:600, color:T.text, textTransform:"capitalize" }}>{w.name||type}</span>
          <IntensityBadge level={w.intensity||"moderate"} />
        </div>
        <div style={{ fontSize:11, color:T.textDim, fontFamily:T.fontMono, marginBottom:10 }}>{w.date||"—"}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
          {[["Duration",`${w.duration_minutes||0}m`],["Calories",w.calories_burned_est||"—"],["Intensity",w.intensity||"moderate"]].map(([l,v])=>(
            <div key={l}>
              <div style={{ fontSize:9, color:T.textDim, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:12, fontWeight:600, color:T.text, fontFamily:T.fontMono, textTransform:"capitalize" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TemplateBrowser ───────────────────────────────────────────────────────────
function TemplateBrowser({ onClose, onStart }) {
  const [sport, setSport] = useState("all");
  const filtered = sport==="all" ? BROWSER_TEMPLATES : BROWSER_TEMPLATES.filter(t=>t.workout_type===sport);
  return (
    <Sheet title="Browse Templates" onClose={onClose} fullscreen>
      <div style={{ display:"flex", gap:8, padding:"12px 20px", overflowX:"auto", scrollbarWidth:"none", flexShrink:0 }}>
        {SPORTS_BROWSER.map(s=>(
          <button key={s.id} onClick={()=>setSport(s.id)}
            style={{ flexShrink:0, padding:"6px 14px", borderRadius:9999, background:sport===s.id?T.teal:T.elevated, color:sport===s.id?"#0A0A0F":T.text, border:`1px solid ${sport===s.id?T.teal:T.border}`, fontSize:12, fontWeight:sport===s.id?700:500, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 20px 24px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {filtered.map(t=>{
            const typeColor = t.workout_type==="running"?T.amber:t.workout_type==="hyrox"?T.violet:t.workout_type==="crossfit"?T.negative:t.workout_type==="yoga"?T.violet:T.teal;
            return (
              <div key={t.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.rCard, padding:14, display:"flex", flexDirection:"column", gap:8 }}>
                <span style={{ alignSelf:"flex-start", fontSize:9, fontWeight:700, letterSpacing:0.8, color:typeColor, background:typeColor+"22", padding:"2px 7px", borderRadius:5 }}>{t.tag}</span>
                <div style={{ fontSize:15, fontWeight:700, color:T.text, lineHeight:1.2 }}>{t.name}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {(t.exercises||[]).map(ex=>(
                    <span key={ex} style={{ fontSize:9, color:T.textMuted, background:T.elevated, border:`1px solid ${T.border}`, borderRadius:5, padding:"2px 6px" }}>{ex}</span>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <Icon name="clock" size={11} color={T.textDim} />
                  <span style={{ fontSize:10, color:T.textDim }}>{t.duration}</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {(t.muscles||[]).map(m=>(
                    <span key={m} style={{ fontSize:9, color:T.teal, background:T.teal+"15", borderRadius:5, padding:"2px 6px" }}>{m}</span>
                  ))}
                </div>
                <button onClick={()=>onStart(t)} style={{ marginTop:4, padding:"8px 0", background:T.teal, color:"#0A0A0F", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Start</button>
              </div>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

// ── AIWorkoutLogger ───────────────────────────────────────────────────────────
function AIWorkoutLogger({ onClose, onRefresh }) {
  const [type, setType] = useState("strength");
  const [duration, setDuration] = useState("60");
  const [intensity, setIntensity] = useState("moderate");
  const [desc, setDesc] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [logging, setLogging] = useState(false);
  const [focusDur, setFocusDur] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const r = await workoutAPI.analyze({ workout_type:type, duration_minutes:Number(duration), intensity, description:desc||undefined });
      setResult(r);
    } catch(e) { alert(e.message||"Analyze failed"); }
    setAnalyzing(false);
  }

  async function handleLog() {
    if (!result) return;
    setLogging(true);
    try {
      await workoutAPI.save({ workout_type:type, duration_minutes:Number(duration), intensity, description:desc||undefined, ai_analysis:result, calories_burned_est:result.calories_burned||result.calories });
      onRefresh?.();
      onClose();
    } catch(e) { alert(e.message||"Log failed"); }
    setLogging(false);
  }

  return (
    <Sheet title="AI Workout Logger" onClose={onClose}>
      <div>
        <div style={{ fontSize:11, color:T.textMuted, marginBottom:8, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>Workout Type</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {WORKOUT_TYPES.map(wt=>(
            <button key={wt} onClick={()=>setType(wt)}
              style={{ padding:"6px 12px", borderRadius:T.rChip, background:type===wt?T.teal:T.elevated, color:type===wt?"#0A0A0F":T.text, border:`1px solid ${type===wt?T.teal:T.border}`, fontSize:12, fontWeight:type===wt?700:500, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
              {wt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize:11, color:T.textMuted, marginBottom:8, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>Duration (minutes)</div>
        <input type="number" value={duration} onChange={e=>setDuration(e.target.value)} min={1} max={300}
          onFocus={()=>setFocusDur(true)} onBlur={()=>setFocusDur(false)} style={inp(focusDur)} />
      </div>

      <div>
        <div style={{ fontSize:11, color:T.textMuted, marginBottom:8, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>Intensity</div>
        <div style={{ display:"flex", gap:8 }}>
          {INTENSITY_OPTS.map(opt=>(
            <button key={opt} onClick={()=>setIntensity(opt)} style={{ flex:1, padding:"8px 0", borderRadius:T.rChip, background:intensity===opt?(opt==="light"?T.teal:opt==="intense"?T.negative:T.amber):T.elevated, color:intensity===opt?"#0A0A0F":T.text, border:`1px solid ${intensity===opt?T.border:T.border}`, fontSize:12, fontWeight:intensity===opt?700:500, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize:11, color:T.textMuted, marginBottom:8, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" }}>Notes (optional)</div>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="e.g. 5×5 squat, felt strong..."
          style={{ ...inp(false), resize:"none" }} />
      </div>

      {!result && (
        <button onClick={handleAnalyze} disabled={analyzing||!duration}
          style={{ padding:"13px 0", background:analyzing?T.elevated:`linear-gradient(135deg,${T.teal},${T.violet})`, color:analyzing?T.textMuted:"#0A0A0F", border:"none", borderRadius:T.rCard, fontSize:14, fontWeight:700, cursor:analyzing?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <Icon name="sparkle" size={16} color={analyzing?T.textMuted:"#0A0A0F"} />
          {analyzing?"Analyzing…":"Analyze with AI"}
        </button>
      )}

      {result && (
        <div style={{ background:T.elevated, border:`1px solid ${T.teal}44`, borderRadius:T.rCard, padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.teal, letterSpacing:0.5, textTransform:"uppercase" }}>AI Analysis</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[["Calories",`${result.calories_burned||result.calories||"—"} kcal`],["Recovery",result.recovery_time||"—"]].map(([l,v])=>(
              <div key={l} style={{ background:T.surface, borderRadius:10, padding:"10px 12px" }}>
                <div style={{ fontSize:9, color:T.textDim, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:16, fontWeight:700, color:T.text, fontFamily:T.fontMono }}>{v}</div>
              </div>
            ))}
          </div>
          {result.muscles_worked?.length>0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {result.muscles_worked.map(m=><span key={m} style={{ fontSize:10, color:T.teal, background:T.teal+"18", borderRadius:6, padding:"3px 8px" }}>{m}</span>)}
            </div>
          )}
          {result.notes && <div style={{ fontSize:12, color:T.textMuted, lineHeight:1.5 }}>{result.notes}</div>}
          <button onClick={handleLog} disabled={logging}
            style={{ padding:"12px 0", background:T.teal, color:"#0A0A0F", border:"none", borderRadius:T.rCard, fontSize:14, fontWeight:700, cursor:logging?"not-allowed":"pointer", fontFamily:"inherit" }}>
            {logging?"Logging…":"Log Workout"}
          </button>
        </div>
      )}
    </Sheet>
  );
}

// ── ExerciseAutocomplete ──────────────────────────────────────────────────────
function ExerciseAutocomplete({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef(null);

  const suggestions = query.trim().length > 0
    ? EXERCISE_DB.filter(e => e.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  function select(name) {
    setQuery(name);
    onChange(name);
    setOpen(false);
  }

  function handleChange(e) {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <input
        value={query}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || "Exercise name…"}
        style={{ ...inp(open && query), width: "100%", boxSizing: "border-box" }}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: T.surface, border: `1px solid ${T.teal}44`,
          borderRadius: 10, marginTop: 3, overflow: "hidden",
          boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
        }}>
          {suggestions.map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); select(s); }}
              style={{
                width: "100%", textAlign: "left", padding: "9px 12px",
                background: "none", border: "none", borderBottom: `0.5px solid ${T.border}`,
                color: T.text, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Icon name="dumbbell" size={12} color={T.teal} />
              {/* Highlight matching part */}
              {(() => {
                const idx = s.toLowerCase().indexOf(query.toLowerCase());
                if (idx === -1) return s;
                return (
                  <>
                    {s.slice(0, idx)}
                    <b style={{ color: T.teal }}>{s.slice(idx, idx + query.length)}</b>
                    {s.slice(idx + query.length)}
                  </>
                );
              })()}
            </button>
          ))}
          {/* Option to add custom if not in DB */}
          {!EXERCISE_DB.some(e => e.toLowerCase() === query.toLowerCase()) && query.trim() && (
            <button
              onMouseDown={e => { e.preventDefault(); select(query.trim()); }}
              style={{ width:"100%", textAlign:"left", padding:"9px 12px", background:`${T.teal}12`, border:"none", color:T.teal, fontSize:12, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:8, fontWeight:600 }}
            >
              <Icon name="plus" size={12} color={T.teal} />
              Add "{query.trim()}" as custom exercise
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── CreateTemplateSheet ───────────────────────────────────────────────────────
function CreateTemplateSheet({ onClose, onRefresh }) {
  const [name, setName] = useState("");
  const [wtype, setWtype] = useState("strength");
  const [dur, setDur] = useState("60");
  const [exercises, setExercises] = useState([{ name:"", sets:"3", reps:"10" }]);
  const [saving, setSaving] = useState(false);

  function addRow() { setExercises(p=>[...p,{ name:"", sets:"3", reps:"10" }]); }
  function removeRow(i) { setExercises(p=>p.filter((_,idx)=>idx!==i)); }
  function updateRow(i,field,val) { setExercises(p=>p.map((r,idx)=>idx===i?{...r,[field]:val}:r)); }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await workoutAPI.saveTemplate({
        name: name.trim(),
        workout_type: wtype,
        estimated_duration: Number(dur) || undefined,
        exercises: exercises.filter(e=>e.name.trim()).map(e=>({
          name: e.name,
          sets: Number(e.sets) || 3,
          reps: e.reps || "10",
        })),
      });
      onRefresh?.();
      onClose();
    } catch(e) { alert(e.message || "Save failed"); }
    setSaving(false);
  }

  const labelStyle = { fontSize:11, color:T.textMuted, marginBottom:8, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" };

  return (
    <Sheet title="New Template" onClose={onClose}>
      {/* Template name */}
      <div>
        <div style={labelStyle}>Template Name</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Push Day A" style={inp(false)} />
      </div>

      {/* Workout type */}
      <div>
        <div style={labelStyle}>Workout Type</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {WORKOUT_TYPES.map(wt=>(
            <button key={wt} onClick={()=>setWtype(wt)}
              style={{ padding:"6px 12px", borderRadius:T.rChip, background:wtype===wt?T.teal:T.elevated, color:wtype===wt?"#0A0A0F":T.text, border:`1px solid ${wtype===wt?T.teal:T.border}`, fontSize:12, fontWeight:wtype===wt?700:500, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
              {wt}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <div style={labelStyle}>Est. Duration (min)</div>
        <input type="number" value={dur} onChange={e=>setDur(e.target.value)} min={1}
          style={{ ...inp(false), width:90, textAlign:"center", fontFamily:T.fontMono }} />
      </div>

      {/* Exercises */}
      <div>
        <div style={{ display:"flex", alignItems:"center", marginBottom:10 }}>
          <span style={{ ...labelStyle, marginBottom:0, flex:1 }}>Exercises</span>
          <button onClick={addRow}
            style={{ background:T.elevated, border:`1px solid ${T.teal}55`, borderRadius:8, padding:"5px 12px", fontSize:12, color:T.teal, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, fontWeight:600 }}>
            <Icon name="plus" size={13} color={T.teal} />Add
          </button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {exercises.map((ex,i)=>(
            <div key={i} style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 12px 10px" }}>
              {/* Row header */}
              <div style={{ display:"flex", alignItems:"center", marginBottom:8 }}>
                <div style={{ width:20, height:20, borderRadius:6, background:T.elevated2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:T.textMuted, fontFamily:T.fontMono, marginRight:8, flexShrink:0 }}>
                  {i+1}
                </div>
                <span style={{ fontSize:11, color:T.textMuted, flex:1, fontWeight:600 }}>Exercise {i+1}</span>
                {exercises.length > 1 && (
                  <button onClick={()=>removeRow(i)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:3, color:T.negative, display:"flex", alignItems:"center" }}>
                    <Icon name="trash" size={13} color={T.negative} />
                  </button>
                )}
              </div>

              {/* Autocomplete name input */}
              <ExerciseAutocomplete
                value={ex.name}
                onChange={val=>updateRow(i,"name",val)}
                placeholder="Search or type exercise name…"
              />

              {/* Sets / Reps side by side */}
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:T.textDim, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, marginBottom:4 }}>Sets</div>
                  <input type="number" value={ex.sets} onChange={e=>updateRow(i,"sets",e.target.value)} min={1} max={20}
                    style={{ ...inp(false), textAlign:"center", fontFamily:T.fontMono, padding:"8px 0" }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:9, color:T.textDim, fontWeight:600, textTransform:"uppercase", letterSpacing:0.4, marginBottom:4 }}>Reps / Duration</div>
                  <input value={ex.reps} onChange={e=>updateRow(i,"reps",e.target.value)} placeholder="10 or 30s"
                    style={{ ...inp(false), textAlign:"center", fontFamily:T.fontMono, padding:"8px 0" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving||!name.trim()}
        style={{ padding:"13px 0", background:saving||!name.trim()?T.elevated:T.teal, color:saving||!name.trim()?T.textMuted:"#0A0A0F", border:"none", borderRadius:T.rCard, fontSize:14, fontWeight:700, cursor:saving||!name.trim()?"not-allowed":"pointer", fontFamily:"inherit" }}>
        {saving ? "Saving…" : "Save Template"}
      </button>
    </Sheet>
  );
}

// ── SpeedDialFAB ─────────────────────────────────────────────────────────────
function SpeedDialFAB({ onAILog, onManualLog, onNewTemplate }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { icon:"sparkle", label:"AI Log", color:T.teal, handler:onAILog },
    { icon:"dumbbell", label:"Manual Log", color:T.amber, handler:onManualLog },
    { icon:"edit", label:"New Template", color:T.violet, handler:onNewTemplate },
  ];
  return (
    <div style={{ position:"absolute", right:20, bottom:92, zIndex:20, display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      {open && actions.map((a,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, animation:`speedDialIn 0.15s ${i*0.05}s both` }}>
          <span style={{ fontSize:11, fontWeight:600, color:T.text, background:T.elevated, border:`1px solid ${T.border}`, borderRadius:8, padding:"4px 10px", whiteSpace:"nowrap" }}>{a.label}</span>
          <button onClick={()=>{ setOpen(false); a.handler(); }}
            style={{ width:44, height:44, borderRadius:9999, background:a.color+"22", border:`1px solid ${a.color}44`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:a.color }}>
            <Icon name={a.icon} size={18} color={a.color} />
          </button>
        </div>
      ))}
      <button onClick={()=>setOpen(o=>!o)}
        style={{ width:56, height:56, borderRadius:9999, background:T.teal, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#0A0A0F", boxShadow:`0 8px 24px ${T.teal}55`, transform:open?"rotate(45deg)":"none", transition:"transform 0.2s cubic-bezier(.34,1.56,.64,1)" }}>
        <Icon name="plus" size={24} color="#0A0A0F" strokeWidth={2.4} />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WorkoutPage({ profile, onProfile }) {
  const [activeSport, setActiveSport] = useState("lifting");
  const [history, setHistory] = useState(MOCK_HISTORY);
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [liveSession, setLiveSession] = useState(false);
  const [liveTemplate, setLiveTemplate] = useState(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showAILogger, setShowAILogger] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);

  async function refresh() {
    try {
      const [logs, tmpl] = await Promise.all([workoutAPI.getAll(14), workoutAPI.getTemplates()]);
      if (logs?.workouts?.length) setHistory(logs.workouts);
      if (tmpl?.templates?.length) setTemplates(tmpl.templates.map(mapTemplate));
    } catch {}
  }

  useEffect(() => {
    (async () => {
      try { await refresh(); } catch {}
      setLoading(false);
    })();
  }, []);

  function mapTemplate(t) {
    return {
      ...t,
      tag: (t.workout_type||"strength").toUpperCase(),
      tagColor: t.workout_type==="running"?T.amber:t.workout_type==="hyrox"?T.violet:T.teal,
      exercises: t.exercises?.length||0,
      duration: t.estimated_duration?`${t.estimated_duration} min`:"—",
      muscles: t.exercises?.slice(0,3).map(e=>e.name)||[],
    };
  }

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden", background:T.bg, position:"relative" }}>
      <style>{`@keyframes speedDialIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <PageHeader title="Workout" subtitle="Day 4 of your cut · 128 days in" profile={profile} onProfile={onProfile} />

      <PageScroll>
        <HeroCard onStart={()=>setLiveSession(true)} onBrowse={()=>setShowBrowser(true)} />

        <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 20px 20px", scrollbarWidth:"none" }}>
          {SPORTS.map(s=>(
            <button key={s.id} onClick={()=>setActiveSport(s.id)}
              style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:9999, background:activeSport===s.id?T.teal:T.elevated, border:`1px solid ${activeSport===s.id?T.teal:T.border}`, color:activeSport===s.id?"#0A0A0F":T.text, fontSize:13, fontWeight:activeSport===s.id?700:500, whiteSpace:"nowrap", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
              <Icon name={s.icon} size={15} color={activeSport===s.id?"#0A0A0F":T.textMuted} />
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ padding:"0 20px 8px" }}>
          <SectionHead title="Templates" trailing={<span style={{ fontSize:12, color:T.teal, cursor:"pointer" }} onClick={()=>setShowBrowser(true)}>See all</span>} />
        </div>
        <div style={{ display:"flex", gap:12, overflowX:"auto", padding:"4px 20px 24px", scrollbarWidth:"none" }}>
          {templates.map(t=>(
            <TemplateCardSmall key={t.id} t={t} onStart={()=>setSelectedTemplate(t)} />
          ))}
        </div>

        <div style={{ padding:"0 20px 16px" }}>
          <SectionHead title="Recent" />
          {loading && <LoadingDots />}
          {!loading && history.length===0 && (
            <EmptyState icon="dumbbell" title="No workouts yet" subtitle="Log your first session to see history" />
          )}
          {history.length>0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {history.map(w=>(
                <HistoryCard key={w.id} w={w} onClick={()=>setSelectedLog(w)} />
              ))}
            </div>
          )}
        </div>
      </PageScroll>

      <SpeedDialFAB
        onAILog={()=>setShowAILogger(true)}
        onManualLog={()=>setLiveSession(true)}
        onNewTemplate={()=>setShowCreateTemplate(true)}
      />

      {showBrowser && <TemplateBrowser onClose={()=>setShowBrowser(false)} onStart={t=>{ setShowBrowser(false); setSelectedTemplate(t); }} />}
      {showAILogger && <AIWorkoutLogger onClose={()=>setShowAILogger(false)} onRefresh={refresh} />}
      {showCreateTemplate && <CreateTemplateSheet onClose={()=>setShowCreateTemplate(false)} onRefresh={refresh} />}

      {selectedTemplate && (
        <TemplateDetailPage
          template={selectedTemplate}
          onBack={() => setSelectedTemplate(null)}
          onStart={() => { setLiveTemplate(selectedTemplate); setSelectedTemplate(null); setLiveSession(true); }}
        />
      )}
      {selectedLog && (
        <WorkoutLogPage workout={selectedLog} onBack={() => { setSelectedLog(null); refresh(); }} mode="history" />
      )}
      {liveSession && (
        <WorkoutLogPage
          workout={liveTemplate}
          onBack={() => { setLiveSession(false); setLiveTemplate(null); refresh(); }}
          mode="live"
        />
      )}
    </div>
  );
}
