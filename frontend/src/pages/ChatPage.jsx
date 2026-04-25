import { useState, useRef, useEffect } from "react";
import { Icon } from "../design/icons";
import { T } from "../design/tokens";
import { Chip, PageHeader } from "../design/components";
import { aiAPI, mealsAPI, scheduleAPI, workoutAPI, userAPI, chatAPI } from "../utils/api";

const STORAGE_KEY = "lifeplan_chat_v1";

function makeInitialMessage(name = "there") {
  return {
    role: "assistant",
    content: `Hey ${name}! I'm your nutrition and routine assistant, powered by Vertex AI.\n\nI know your meal plan, macro targets, training schedule, and food preferences. Ask me anything about meals, swaps, grocery lists, or routine adjustments.\n\nWhen you find a meal you like, just say **"save this"** and I'll add it to your meals library. For workouts, just ask and say **"save it"** to add to your templates.`,
  };
}

const WORKOUT_TYPES_CHAT = ["strength","crossfit","running","hiit","yoga","cycling","football","boxing","swimming"];
const QUICK_PROMPTS = [
  "What should I eat for dinner tonight?",
  "Suggest a high protein lunch under 500 kcal",
  "Give me a chest & biceps workout",
  "Give me a CrossFit WOD for today",
  "Suggest a high protein snack from Lidl",
  "Generate this week's grocery list",
  "How am I doing on my protein today?",
  "I missed CrossFit today, adjust my calories",
];
const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const MEAL_TYPES_CHAT = ["breakfast","lunch","dinner","snack"];

function inferTemplateExerciseType(exercise) {
  const repsText = `${exercise?.reps??""}`.trim().toLowerCase();
  const hasWeight = exercise?.weight_suggestion_kg != null && `${exercise.weight_suggestion_kg}`.trim() !== "";
  if (/\b(sec|secs|second|seconds|min|mins|minute|minutes)\b/.test(repsText)) return "timed";
  return hasWeight ? "weighted" : "bodyweight";
}

function FormattedText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height:4 }} />;
        const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ");
        const content = isBullet ? line.replace(/^[\s\-•]+/, "") : line;
        const parts = content.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j} style={{ color:T.text, fontWeight:600 }}>{p.slice(2,-2)}</strong>
            : p
        );
        return (
          <div key={i} style={{ display:"flex", gap:6 }}>
            {isBullet && <span style={{ color:T.teal, marginTop:1, flexShrink:0 }}>•</span>}
            <span style={{ fontSize:13, color:T.textMuted, lineHeight:1.55 }}>{rendered}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── MealActionCard ───────────────────────────────────────────────────────────
function MealActionCard({ data, onSave, onDismiss }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("macros");
  const [edited, setEdited] = useState({ ...data });
  const [ingredients, setIngredients] = useState((data.ingredients||[]).map(ing=>({ name:ing.name||"", amount:ing.amount||"" })));
  const [reestimating, setReestimating] = useState(false);

  async function reestimateFromIngredients() {
    if (!ingredients.length) return;
    const desc = ingredients.filter(i=>i.name.trim()).map(i=>`${i.amount?i.amount+" ":""}${i.name}`).join(", ");
    setReestimating(true);
    try {
      const result = await aiAPI.estimateMacros(desc);
      if (!result.error) {
        setEdited(p=>({ ...p, calories:result.calories??p.calories, protein_g:result.protein_g??p.protein_g, carbs_g:result.carbs_g??p.carbs_g, fat_g:result.fat_g??p.fat_g }));
        setTab("macros");
      }
    } catch {}
    setReestimating(false);
  }

  function addIngredient() { setIngredients(p=>[...p,{ name:"", amount:"" }]); }
  function updateIngredient(i, field, val) { setIngredients(p=>p.map((ing,idx)=>idx===i?{...ing,[field]:val}:ing)); }
  function removeIngredient(i) { setIngredients(p=>p.filter((_,idx)=>idx!==i)); }

  async function handleSave() {
    setSaving(true);
    try { await onSave({ ...edited, ingredients }); setSaved(true); } catch(e) { alert("Failed to save: "+e.message); }
    setSaving(false);
  }

  const accent = saved ? T.teal : T.violet;
  const tabBtnStyle = (active) => ({ flex:1, padding:"6px 0", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit", border:"none", background:active?T.elevated2:"transparent", color:active?T.text:T.textMuted, fontWeight:active?600:400 });

  return (
    <div style={{ marginTop:10, borderRadius:12, border:`1px solid ${accent}44`, padding:12, background:accent+"0D", display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <Icon name="meal" size={13} color={accent} />
        <span style={{ fontSize:11, fontWeight:600, color:T.text }}>{saved?"Saved & Logged ✓":"Save this meal?"}</span>
        {!saved && <button onClick={onDismiss} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:T.textDim, padding:0 }}><Icon name="x" size={12} color={T.textDim} /></button>}
      </div>

      {!saved && (
        <>
          <div style={{ display:"flex", background:T.elevated, borderRadius:8, padding:2, gap:2 }}>
            {["macros","ingredients"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={tabBtnStyle(tab===t)}>{t}</button>
            ))}
          </div>

          {tab==="macros" && (
            <div style={{ background:T.elevated, borderRadius:10, padding:10, display:"flex", flexDirection:"column", gap:8 }}>
              <input value={edited.name||""} onChange={e=>setEdited(p=>({...p,name:e.target.value}))} placeholder="Meal name"
                style={{ width:"100%", background:T.elevated2, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 10px", color:T.text, fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
              <div style={{ display:"flex", gap:4 }}>
                {MEAL_TYPES_CHAT.map(type=>(
                  <button key={type} onClick={()=>setEdited(p=>({...p,meal_type:type}))}
                    style={{ flex:1, padding:"5px 0", borderRadius:6, fontSize:10, textTransform:"capitalize", cursor:"pointer", fontFamily:"inherit", border:"none", background:edited.meal_type===type?T.violet+"44":T.elevated2, color:edited.meal_type===type?T.violet:T.textMuted }}>
                    {type}
                  </button>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {[["calories","kcal",T.amber],["protein_g","g prot",T.teal],["carbs_g","g carbs",T.amber],["fat_g","g fat",T.textMuted]].map(([key,unit,color])=>(
                  <div key={key} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <input type="number" value={edited[key]||""} onChange={e=>setEdited(p=>({...p,[key]:e.target.value}))}
                      style={{ width:56, background:T.elevated2, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 8px", color:T.text, fontSize:11, fontFamily:"inherit", outline:"none" }} min={0} />
                    <span style={{ fontSize:9, color }}>{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="ingredients" && (
            <div style={{ background:T.elevated, borderRadius:10, padding:10, display:"flex", flexDirection:"column", gap:6 }}>
              {ingredients.map((ing,i)=>(
                <div key={i} style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <input value={ing.amount} onChange={e=>updateIngredient(i,"amount",e.target.value)} placeholder="qty"
                    style={{ width:48, background:T.elevated2, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 8px", color:T.textMuted, fontSize:11, fontFamily:"inherit", outline:"none" }} />
                  <input value={ing.name} onChange={e=>updateIngredient(i,"name",e.target.value)} placeholder="ingredient"
                    style={{ flex:1, background:T.elevated2, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 8px", color:T.text, fontSize:11, fontFamily:"inherit", outline:"none" }} />
                  <button onClick={()=>removeIngredient(i)} style={{ background:"none", border:"none", cursor:"pointer", color:T.textDim, padding:2 }}><Icon name="trash" size={11} color={T.negative} /></button>
                </div>
              ))}
              <button onClick={addIngredient} style={{ padding:"6px 0", fontSize:10, color:T.textDim, border:`1px dashed ${T.border}`, borderRadius:8, background:"none", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                <Icon name="plus" size={10} color={T.textDim} /> Add ingredient
              </button>
              <button onClick={reestimateFromIngredients} disabled={reestimating||!ingredients.some(i=>i.name.trim())}
                style={{ padding:"7px 0", fontSize:11, color:T.violet, background:T.violet+"18", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6, opacity:reestimating||!ingredients.some(i=>i.name.trim())?0.4:1 }}>
                <Icon name={reestimating?"history":"bolt"} size={11} color={T.violet} />
                {reestimating?"Re-estimating…":"Re-estimate macros"}
              </button>
            </div>
          )}
        </>
      )}

      {saved && (
        <div style={{ background:T.elevated, borderRadius:10, padding:10 }}>
          <p style={{ fontSize:13, fontWeight:500, color:T.text, margin:0 }}>{edited.name}</p>
          <div style={{ display:"flex", gap:10, marginTop:4, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:T.amber }}>{edited.calories} kcal</span>
            <span style={{ fontSize:11, color:T.teal }}>{edited.protein_g}g protein</span>
          </div>
        </div>
      )}

      {!saved && (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onDismiss} style={{ flex:1, padding:"8px 0", fontSize:11, color:T.textMuted, background:T.elevated, border:"none", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>Dismiss</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex:1, padding:"8px 0", fontSize:11, color:"#0A0A0F", background:saving?T.elevated:T.teal, border:"none", borderRadius:8, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:4, opacity:saving?0.5:1 }}>
            <Icon name="check" size={11} color="#0A0A0F" />
            {saving?"Saving…":"Save & Log Today"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ScheduleActionCard ───────────────────────────────────────────────────────
function ScheduleActionCard({ data, onSave, onDismiss }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function handleSave() {
    setSaving(true);
    try { await onSave(data); setSaved(true); } catch(e) { alert(e.message); }
    setSaving(false);
  }
  const accent = saved ? T.teal : T.catClass;
  return (
    <div style={{ marginTop:10, borderRadius:12, border:`1px solid ${accent}44`, padding:12, background:accent+"0D", display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <Icon name="calendar" size={13} color={accent} />
        <span style={{ fontSize:11, fontWeight:600, color:T.text }}>{saved?"Added to Schedule ✓":"Add to schedule?"}</span>
        {!saved && <button onClick={onDismiss} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", padding:0 }}><Icon name="x" size={12} color={T.textDim} /></button>}
      </div>
      <div style={{ background:T.elevated, borderRadius:10, padding:10 }}>
        <p style={{ fontSize:13, fontWeight:500, color:T.text, margin:0 }}>{data.title}</p>
        <p style={{ fontSize:10, color:T.textMuted, marginTop:4, marginBottom:0 }}>{DAY_NAMES[data.day_of_week]} · {data.start_time} – {data.end_time}</p>
        {data.reasoning && <p style={{ fontSize:10, color:T.textDim, marginTop:4, marginBottom:0, lineHeight:1.4 }}>{data.reasoning}</p>}
      </div>
      {!saved && (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onDismiss} style={{ flex:1, padding:"8px 0", fontSize:11, color:T.textMuted, background:T.elevated, border:"none", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>Dismiss</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex:1, padding:"8px 0", fontSize:11, color:"#0A0A0F", background:saving?T.elevated:T.catClass, border:"none", borderRadius:8, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
            <Icon name="check" size={11} color="#0A0A0F" />
            {saving?"Saving…":"Add to Schedule"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── WorkoutTemplateCard ──────────────────────────────────────────────────────
function WorkoutTemplateCard({ data, onSave, onDismiss }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("overview");
  const [edited, setEdited] = useState({ name:data.name||"", workout_type:data.workout_type||"strength", estimated_duration:data.estimated_duration||"", description:data.description||"" });
  const [exercises, setExercises] = useState((data.exercises||[]).map(ex=>({...ex})));

  function addExercise() { setExercises(p=>[...p,{ name:"", sets:3, reps:"10", weight_suggestion_kg:"", notes:"" }]); }
  function updateExercise(i,field,val) { setExercises(p=>p.map((ex,idx)=>idx===i?{...ex,[field]:val}:ex)); }
  function removeExercise(i) { setExercises(p=>p.filter((_,idx)=>idx!==i)); }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ ...data, ...edited, estimated_duration:edited.estimated_duration?Number(edited.estimated_duration):null, exercises:exercises.filter(ex=>ex.name.trim()).map(ex=>({ name:ex.name, sets:ex.sets?Number(ex.sets):null, reps:ex.reps||null, weight_suggestion_kg:ex.weight_suggestion_kg?Number(ex.weight_suggestion_kg):null, notes:ex.notes||null })) });
      setSaved(true);
    } catch(e) { alert(e.message); }
    setSaving(false);
  }

  const accent = saved ? T.teal : T.teal;
  const tabBtnStyle = (active) => ({ flex:1, padding:"6px 0", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit", border:"none", background:active?T.elevated2:"transparent", color:active?T.text:T.textMuted, fontWeight:active?600:400 });

  return (
    <div style={{ marginTop:10, borderRadius:12, border:`1px solid ${accent}44`, padding:12, background:accent+"0D", display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <Icon name="dumbbell" size={13} color={accent} />
        <span style={{ fontSize:11, fontWeight:600, color:T.text }}>{saved?"Workout Saved ✓":"Save this workout?"}</span>
        {!saved && <button onClick={onDismiss} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", padding:0 }}><Icon name="x" size={12} color={T.textDim} /></button>}
      </div>

      {!saved && (
        <>
          <div style={{ display:"flex", background:T.elevated, borderRadius:8, padding:2, gap:2 }}>
            {["overview","exercises"].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={tabBtnStyle(tab===t)}>
                {t}{t==="exercises"&&exercises.length>0?` (${exercises.length})`:""}
              </button>
            ))}
          </div>

          {tab==="overview" && (
            <div style={{ background:T.elevated, borderRadius:10, padding:10, display:"flex", flexDirection:"column", gap:8 }}>
              <input value={edited.name} onChange={e=>setEdited(p=>({...p,name:e.target.value}))} placeholder="Workout name"
                style={{ width:"100%", background:T.elevated2, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 10px", color:T.text, fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {WORKOUT_TYPES_CHAT.map(type=>(
                  <button key={type} onClick={()=>setEdited(p=>({...p,workout_type:type}))}
                    style={{ padding:"4px 8px", borderRadius:9999, fontSize:9, textTransform:"capitalize", cursor:"pointer", fontFamily:"inherit", border:"none", background:edited.workout_type===type?T.teal+"44":T.elevated2, color:edited.workout_type===type?T.teal:T.textMuted }}>
                    {type}
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input type="number" value={edited.estimated_duration} onChange={e=>setEdited(p=>({...p,estimated_duration:e.target.value}))}
                  style={{ width:56, background:T.elevated2, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 8px", color:T.text, fontSize:11, fontFamily:"inherit", outline:"none" }} min={1} placeholder="60" />
                <span style={{ fontSize:10, color:T.textMuted }}>min duration</span>
              </div>
              <textarea value={edited.description} onChange={e=>setEdited(p=>({...p,description:e.target.value}))} rows={2} placeholder="Description (optional)"
                style={{ width:"100%", background:T.elevated2, border:`1px solid ${T.border}`, borderRadius:6, padding:"6px 10px", color:T.text, fontSize:11, fontFamily:"inherit", outline:"none", resize:"none", boxSizing:"border-box" }} />
            </div>
          )}

          {tab==="exercises" && (
            <div style={{ background:T.elevated, borderRadius:10, padding:10, display:"flex", flexDirection:"column", gap:8 }}>
              {exercises.length===0 && <p style={{ fontSize:11, color:T.textMuted, textAlign:"center", padding:"8px 0", margin:0 }}>No exercises yet.</p>}
              {exercises.map((ex,i)=>{
                const exType = inferTemplateExerciseType(ex);
                return (
                  <div key={i} style={{ background:T.elevated2, borderRadius:8, padding:8, display:"flex", flexDirection:"column", gap:6 }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <input value={ex.name} onChange={e=>updateExercise(i,"name",e.target.value)} placeholder="Exercise name"
                        style={{ flex:1, background:T.elevated, border:`1px solid ${T.border}`, borderRadius:6, padding:"4px 8px", color:T.text, fontSize:11, fontFamily:"inherit", outline:"none" }} />
                      <button onClick={()=>removeExercise(i)} style={{ background:"none", border:"none", cursor:"pointer", color:T.textDim, padding:2 }}><Icon name="trash" size={11} color={T.negative} /></button>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      {[["Sets","sets","number","3"],["Reps","reps","text",exType==="timed"?"30":"10"],...(exType==="weighted"?[["kg","weight_suggestion_kg","number","BW"]]:[])]
                        .map(([label,field,type,ph])=>(
                          <div key={field} style={{ flex:1 }}>
                            <div style={{ fontSize:9, color:T.textDim, marginBottom:2 }}>{label}</div>
                            <input type={type} value={ex[field]??""} onChange={e=>updateExercise(i,field,e.target.value)} placeholder={ph}
                              style={{ width:"100%", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:5, padding:"3px 6px", color:T.text, fontSize:11, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
                          </div>
                        ))
                      }
                    </div>
                  </div>
                );
              })}
              <button onClick={addExercise} style={{ padding:"7px 0", fontSize:10, color:T.textDim, border:`1px dashed ${T.border}`, borderRadius:8, background:"none", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                <Icon name="plus" size={10} color={T.textDim} /> Add exercise
              </button>
            </div>
          )}
        </>
      )}

      {saved && (
        <div style={{ background:T.elevated, borderRadius:10, padding:10 }}>
          <p style={{ fontSize:13, fontWeight:500, color:T.text, margin:0 }}>{edited.name}</p>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
            <span style={{ fontSize:10, background:T.teal+"18", color:T.teal, padding:"2px 8px", borderRadius:9999, textTransform:"capitalize" }}>{edited.workout_type}</span>
            {edited.estimated_duration && <span style={{ fontSize:10, color:T.textMuted }}>{edited.estimated_duration} min</span>}
          </div>
        </div>
      )}

      {!saved && (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onDismiss} style={{ flex:1, padding:"8px 0", fontSize:11, color:T.textMuted, background:T.elevated, border:"none", borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>Dismiss</button>
          <button onClick={handleSave} disabled={saving||!edited.name.trim()}
            style={{ flex:1, padding:"8px 0", fontSize:11, color:"#0A0A0F", background:saving||!edited.name.trim()?T.elevated:T.teal, border:"none", borderRadius:8, cursor:saving||!edited.name.trim()?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:4, opacity:saving||!edited.name.trim()?0.5:1 }}>
            <Icon name="check" size={11} color="#0A0A0F" />
            {saving?"Saving…":"Save Workout"}
          </button>
        </div>
      )}
    </div>
  );
}

function ActionCard({ data, onSave, onDismiss }) {
  if (data.action_type==="save_meal_template") return <MealActionCard data={data} onSave={onSave} onDismiss={onDismiss} />;
  if (data.action_type==="add_schedule_event") return <ScheduleActionCard data={data} onSave={onSave} onDismiss={onDismiss} />;
  if (data.action_type==="save_workout_template") return <WorkoutTemplateCard data={data} onSave={onSave} onDismiss={onDismiss} />;
  return null;
}

// ─── Main ChatPage export (all state/effects/handlers preserved exactly) ────────
export default function ChatPage() {
  const [messages, setMessages] = useState(() => {
    try { const saved = sessionStorage.getItem(STORAGE_KEY); if (saved) return JSON.parse(saved); } catch {}
    return [makeInitialMessage()];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const messagesEndRef = useRef(null);
  const composerRef = useRef(null);

  useEffect(() => {
    userAPI.getProfile().then(p => {
      const name = p.username || "there";
      setUsername(name);
      setMessages(prev => {
        if (prev.length===1 && prev[0].role==="assistant" && prev[0].content.startsWith("Hey there!")) {
          return [makeInitialMessage(name)];
        }
        return prev;
      });
    }).catch(() => {});
  }, []);

  async function openHistory() {
    setShowHistory(true); setLoadingSessions(true);
    try { const data = await chatAPI.getSessions(); setSessions(data); } catch {}
    setLoadingSessions(false);
  }

  async function loadSession(id) {
    try {
      const s = await chatAPI.getSession(id);
      setMessages(s.messages);
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s.messages)); } catch {}
    } catch(e) { alert("Failed to load session: " + e.message); }
    setShowHistory(false);
  }

  async function deleteSession(id, e) {
    e.stopPropagation();
    try { await chatAPI.deleteSession(id); setSessions(prev => prev.filter(s => s.id !== id)); } catch {}
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  useEffect(() => { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {} }, [messages]);
  useEffect(() => {
    if (!composerRef.current) return;
    composerRef.current.style.height = "auto";
    const next = Math.min(composerRef.current.scrollHeight, 180);
    composerRef.current.style.height = `${next}px`;
  }, [input]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    const newMessages = [...messages, { role:"user", content:userMsg }];
    setMessages(newMessages); setInput("");
    if (composerRef.current) composerRef.current.style.height = "auto";
    setLoading(true);
    try {
      const history = newMessages.slice(1).map(m => ({ role:m.role==="assistant"?"assistant":"user", content:m.content }));
      const data = await aiAPI.chat(userMsg, history, "general");
      setMessages(prev => [...prev, { role:"assistant", content:data.reply, structured:data.structured_data }]);
    } catch(err) {
      const msg = err.message?.includes("429") ? "You're sending messages too quickly. Please wait a moment." : err.message || "Something went wrong. Please try again.";
      setMessages(prev => [...prev, { role:"assistant", content:msg }]);
    }
    setLoading(false);
  }

  function dismissAction(msgIndex) {
    setMessages(prev => prev.map((m, i) => i===msgIndex ? { ...m, structured:null } : m));
  }

  async function handleSaveAction(data) {
    if (data.action_type==="save_meal_template") {
      const saved = await mealsAPI.saveTemplate({ name:data.name, meal_type:data.meal_type, calories:Number(data.calories), protein_g:Number(data.protein_g), carbs_g:Number(data.carbs_g)||null, fat_g:Number(data.fat_g)||null, ingredients:data.ingredients||[], prep_instructions:data.prep_instructions });
      await mealsAPI.logMeal({ meal_type:data.meal_type, template_id:saved.id, name:data.name, calories:Number(data.calories), protein_g:Number(data.protein_g), carbs_g:Number(data.carbs_g)||null, fat_g:Number(data.fat_g)||null });
    } else if (data.action_type==="add_schedule_event") {
      await scheduleAPI.create({ title:data.title, event_type:data.event_type, day_of_week:data.day_of_week, start_time:data.start_time, end_time:data.end_time });
    } else if (data.action_type==="save_workout_template") {
      await workoutAPI.saveTemplate({ name:data.name, workout_type:data.workout_type, exercises:data.exercises||[], description:data.description, estimated_duration:data.estimated_duration, tags:data.tags||[] });
    }
  }

  async function newChat() {
    const hasUserMessages = messages.some(m => m.role==="user");
    if (hasUserMessages) {
      try { const clean = messages.map(({ role, content }) => ({ role, content })); await chatAPI.saveSession(clean); } catch {}
    }
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    setMessages([makeInitialMessage(username || "there")]);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:T.bg, position:"relative", overflow:"hidden" }}>

      {/* History panel */}
      {showHistory && (
        <div style={{ position:"absolute", inset:0, zIndex:20, background:T.bg, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"12px 20px 10px", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            <button onClick={()=>setShowHistory(false)} style={{ background:T.elevated, border:`1px solid ${T.border}`, borderRadius:9999, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:T.text }}>
              <Icon name="chev-left" size={16} />
            </button>
            <span style={{ fontSize:14, fontWeight:600, color:T.text }}>Chat History</span>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"12px 20px", display:"flex", flexDirection:"column", gap:8 }}>
            {loadingSessions && <p style={{ fontSize:11, color:T.textMuted, textAlign:"center", padding:"24px 0", margin:0 }}>Loading…</p>}
            {!loadingSessions && sessions.length===0 && (
              <p style={{ fontSize:11, color:T.textMuted, textAlign:"center", padding:"24px 0", margin:0, lineHeight:1.6 }}>No saved sessions yet.<br />Start a chat, then tap New Chat to save it.</p>
            )}
            {sessions.map(s=>(
              <button key={s.id} onClick={()=>loadSession(s.id)}
                style={{ width:"100%", textAlign:"left", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:12, padding:"10px 14px", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
                  <p style={{ fontSize:12, color:T.text, lineHeight:1.4, margin:0, flex:1, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{s.title}</p>
                  <button onClick={e=>deleteSession(s.id,e)} style={{ background:"none", border:"none", cursor:"pointer", color:T.textDim, flexShrink:0, padding:2, marginTop:1 }}>
                    <Icon name="trash" size={12} color={T.negative} />
                  </button>
                </div>
                <p style={{ fontSize:10, color:T.textDim, marginTop:4, marginBottom:0 }}>{s.message_count} messages · {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="AI Assistant"
        subtitle="Gemini 2.5 + RAG"
        trailing={
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={openHistory} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:8, cursor:"pointer", color:T.textMuted, fontSize:11, fontFamily:"inherit" }}>
              <Icon name="history" size={11} color={T.textMuted} /> History
            </button>
            <button onClick={newChat} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:8, cursor:"pointer", color:T.textMuted, fontSize:11, fontFamily:"inherit" }}>
              <Icon name="sparkle" size={11} color={T.textMuted} /> New
            </button>
          </div>
        }
      />

      {/* Quick prompts */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"0 20px 10px", scrollbarWidth:"none", flexShrink:0 }}>
        {QUICK_PROMPTS.map((p,i)=>(
          <button key={i} onClick={()=>sendMessage(p)}
            style={{ flexShrink:0, padding:"6px 12px", background:T.elevated, border:`1px solid ${T.border}`, borderRadius:9999, fontSize:11, color:T.textMuted, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px 12px", display:"flex", flexDirection:"column", gap:12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display:"flex", gap:10, flexDirection:msg.role==="user"?"row-reverse":"row" }}>
            <div style={{ width:28, height:28, borderRadius:9999, background:msg.role==="user"?T.teal+"22":T.violet+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name={msg.role==="user"?"profile":"sparkle"} size={14} color={msg.role==="user"?T.teal:T.violet} />
            </div>
            <div style={{ maxWidth:"80%", borderRadius:14, padding:"10px 14px", background:msg.role==="user"?T.teal+"22":T.surface, border:`1px solid ${msg.role==="user"?T.teal+"44":T.border}` }}>
              {msg.role==="user"
                ? <p style={{ margin:0, fontSize:13, color:T.text, whiteSpace:"pre-wrap", lineHeight:1.5 }}>{msg.content}</p>
                : <FormattedText text={msg.content} />
              }
              {msg.structured?.action_type && (
                <ActionCard data={msg.structured} onSave={handleSaveAction} onDismiss={()=>dismissAction(i)} />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:9999, background:T.violet+"22", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="sparkle" size={14} color={T.violet} />
            </div>
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"10px 14px" }}>
              <span style={{ fontSize:13, color:T.textMuted }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding:"10px 16px 16px", borderTop:`1px solid ${T.border}`, background:T.elevated, flexShrink:0 }}>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
          <textarea
            ref={composerRef}
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if (e.key==="Enter"&&!e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about meals, swaps, macros…"
            rows={1}
            style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"10px 14px", fontSize:13, color:T.text, fontFamily:"inherit", outline:"none", resize:"none", overflowY:"auto", lineHeight:1.5, boxSizing:"border-box" }}
          />
          <button onClick={()=>sendMessage()} disabled={!input.trim()||loading}
            style={{ width:40, height:40, borderRadius:9999, background:input.trim()&&!loading?T.teal:T.elevated, border:"none", cursor:input.trim()&&!loading?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.15s" }}>
            <Icon name="send" size={18} color={input.trim()&&!loading?"#0A0A0F":T.textDim} />
          </button>
        </div>
      </div>
    </div>
  );
}
