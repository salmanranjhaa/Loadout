import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, CheckCircle, X, UtensilsCrossed, Calendar, Edit2, Plus, Trash2, Dumbbell, RefreshCw, RotateCcw, History, ChevronLeft } from "lucide-react";
import { aiAPI, mealsAPI, scheduleAPI, workoutAPI, userAPI, chatAPI } from "../utils/api";

const STORAGE_KEY = "lifeplan_chat_v1";

function makeInitialMessage(name = "there") {
  return {
    role: "assistant",
    content: `Hey ${name}! I'm your nutrition and routine assistant, powered by Vertex AI.\n\nI know your meal plan, macro targets, training schedule, and food preferences. Ask me anything about meals, swaps, grocery lists, or routine adjustments.\n\nWhen you find a meal you like, just say **"save this"** and I'll add it to your meals library. For workouts, just ask and say **"save it"** to add to your templates.`,
  };
}

const WORKOUT_TYPES_CHAT = ["strength", "crossfit", "running", "hiit", "yoga", "cycling", "football", "boxing", "swimming"];

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

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// I format basic markdown-style text from the AI into styled elements
function FormattedText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ");
        const content = isBullet ? line.replace(/^[\s\-•]+/, "") : line;
        const parts = content.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j} className="text-slate-200 font-semibold">{p.slice(2, -2)}</strong>
            : p
        );
        return (
          <div key={i} className={isBullet ? "flex gap-1.5" : ""}>
            {isBullet && <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>}
            <span>{rendered}</span>
          </div>
        );
      })}
    </div>
  );
}

const MEAL_TYPES_CHAT = ["breakfast", "lunch", "dinner", "snack"];

// ─── Meal save card ───────────────────────────────────────────────────────────
function MealActionCard({ data, onSave, onDismiss }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("macros"); // "macros" | "ingredients"
  const [edited, setEdited] = useState({ ...data });
  const [ingredients, setIngredients] = useState(
    (data.ingredients || []).map(ing => ({ name: ing.name || "", amount: ing.amount || "" }))
  );
  const [reestimating, setReestimating] = useState(false);

  async function reestimateFromIngredients() {
    if (!ingredients.length) return;
    const desc = ingredients.filter(i => i.name.trim()).map(i => `${i.amount ? i.amount + " " : ""}${i.name}`).join(", ");
    setReestimating(true);
    try {
      const result = await aiAPI.estimateMacros(desc);
      if (!result.error) {
        setEdited(p => ({
          ...p,
          calories: result.calories ?? p.calories,
          protein_g: result.protein_g ?? p.protein_g,
          carbs_g: result.carbs_g ?? p.carbs_g,
          fat_g: result.fat_g ?? p.fat_g,
        }));
        setTab("macros");
      }
    } catch { /* ignore */ }
    setReestimating(false);
  }

  function addIngredient() {
    setIngredients(p => [...p, { name: "", amount: "" }]);
  }

  function updateIngredient(i, field, val) {
    setIngredients(p => p.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing));
  }

  function removeIngredient(i) {
    setIngredients(p => p.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ ...edited, ingredients });
      setSaved(true);
    } catch (e) {
      alert("Failed to save: " + e.message);
    }
    setSaving(false);
  }

  return (
    <div className={`mt-2 rounded-xl border p-3 space-y-2 ${saved ? "border-emerald-700/50 bg-emerald-950/20" : "border-purple-700/50 bg-purple-950/20"}`}>
      <div className="flex items-center gap-2">
        <UtensilsCrossed size={13} className={saved ? "text-emerald-400" : "text-purple-400"} />
        <span className="text-[11px] font-semibold text-slate-300">{saved ? "Saved & Logged ✓" : "Save this meal?"}</span>
        {!saved && (
          <button onClick={onDismiss} className="ml-auto text-slate-600 hover:text-slate-400"><X size={12} /></button>
        )}
      </div>

      {!saved && (
        <>
          {/* Tab switcher */}
          <div className="flex bg-slate-800/60 rounded-lg p-0.5 gap-0.5">
            {["macros", "ingredients"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1 rounded text-[10px] capitalize transition-all ${tab === t ? "bg-slate-700 text-slate-200" : "text-slate-500"}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === "macros" && (
            <div className="bg-slate-800/60 rounded-lg p-2.5 space-y-2">
              <input value={edited.name || ""} onChange={e => setEdited(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 ring-purple-500/50"
                placeholder="Meal name" />
              <div className="flex gap-1">
                {MEAL_TYPES_CHAT.map(type => (
                  <button key={type} onClick={() => setEdited(p => ({ ...p, meal_type: type }))}
                    className={`flex-1 py-1 rounded text-[9px] capitalize ${edited.meal_type === type ? "bg-purple-600/30 text-purple-300" : "bg-slate-700 text-slate-500"}`}>
                    {type}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[["calories","kcal","text-amber-400"],["protein_g","g prot","text-blue-400"],["carbs_g","g carbs","text-emerald-400"],["fat_g","g fat","text-slate-400"]].map(([key, unit, color]) => (
                  <div key={key} className="flex items-center gap-1">
                    <input type="number" value={edited[key] || ""} onChange={e => setEdited(p => ({ ...p, [key]: e.target.value }))}
                      className="w-16 bg-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none" min={0} />
                    <span className={`text-[9px] ${color}`}>{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "ingredients" && (
            <div className="bg-slate-800/60 rounded-lg p-2.5 space-y-1.5">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <input value={ing.amount} onChange={e => updateIngredient(i, "amount", e.target.value)}
                    placeholder="qty" className="w-14 bg-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                  />
                  <input value={ing.name} onChange={e => updateIngredient(i, "name", e.target.value)}
                    placeholder="ingredient" className="flex-1 bg-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                  />
                  <button onClick={() => removeIngredient(i)} className="p-1 text-slate-600 hover:text-red-400">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
              <button onClick={addIngredient} className="w-full py-1 text-[10px] text-slate-500 border border-dashed border-slate-700 rounded-lg hover:border-purple-700 hover:text-purple-400 flex items-center justify-center gap-1">
                <Plus size={10} /> Add ingredient
              </button>
              <button onClick={reestimateFromIngredients} disabled={reestimating || !ingredients.some(i => i.name.trim())}
                className="w-full py-1.5 text-[11px] text-purple-300 bg-purple-600/10 rounded-lg hover:bg-purple-600/20 disabled:opacity-40 flex items-center justify-center gap-1.5 mt-1">
                <RefreshCw size={11} className={reestimating ? "animate-spin" : ""} />
                {reestimating ? "Re-estimating…" : "Re-estimate macros from ingredients"}
              </button>
            </div>
          )}
        </>
      )}

      {saved && (
        <div className="bg-slate-800/60 rounded-lg p-2.5">
          <p className="text-sm font-medium text-slate-200">{edited.name}</p>
          <div className="flex gap-3 mt-1 flex-wrap">
            <span className="text-[11px] text-amber-400">{edited.calories} kcal</span>
            <span className="text-[11px] text-blue-400">{edited.protein_g}g protein</span>
          </div>
        </div>
      )}

      {!saved && (
        <div className="flex gap-2">
          <button onClick={onDismiss} className="flex-1 py-1.5 text-[11px] text-slate-500 bg-slate-800/60 rounded-lg">Dismiss</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-1.5 text-[11px] text-emerald-300 bg-emerald-600/20 rounded-lg hover:bg-emerald-600/30 disabled:opacity-40 flex items-center justify-center gap-1">
            <CheckCircle size={11} />
            {saving ? "Saving…" : "Save & Log Today"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Schedule save card ───────────────────────────────────────────────────────
function ScheduleActionCard({ data, onSave, onDismiss }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await onSave(data); setSaved(true); } catch (e) { alert(e.message); }
    setSaving(false);
  }

  return (
    <div className={`mt-2 rounded-xl border p-3 space-y-2 ${saved ? "border-emerald-700/50 bg-emerald-950/20" : "border-blue-700/50 bg-blue-950/20"}`}>
      <div className="flex items-center gap-2">
        <Calendar size={13} className={saved ? "text-emerald-400" : "text-blue-400"} />
        <span className="text-[11px] font-semibold text-slate-300">{saved ? "Added to Schedule ✓" : "Add to schedule?"}</span>
        {!saved && <button onClick={onDismiss} className="ml-auto text-slate-600 hover:text-slate-400"><X size={12} /></button>}
      </div>
      <div className="bg-slate-800/60 rounded-lg p-2.5">
        <p className="text-sm font-medium text-slate-200">{data.title}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{DAY_NAMES[data.day_of_week]} · {data.start_time} – {data.end_time}</p>
        {data.reasoning && <p className="text-[10px] text-slate-500 mt-1">{data.reasoning}</p>}
      </div>
      {!saved && (
        <div className="flex gap-2">
          <button onClick={onDismiss} className="flex-1 py-1.5 text-[11px] text-slate-500 bg-slate-800/60 rounded-lg">Dismiss</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-1.5 text-[11px] text-blue-300 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 disabled:opacity-40 flex items-center justify-center gap-1">
            <CheckCircle size={11} />
            {saving ? "Saving…" : "Add to Schedule"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Workout template save card (editable) ────────────────────────────────────
function WorkoutTemplateCard({ data, onSave, onDismiss }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("overview"); // "overview" | "exercises"
  const [edited, setEdited] = useState({
    name: data.name || "",
    workout_type: data.workout_type || "strength",
    estimated_duration: data.estimated_duration || "",
    description: data.description || "",
  });
  const [exercises, setExercises] = useState(
    (data.exercises || []).map(ex => ({ ...ex }))
  );

  function addExercise() {
    setExercises(p => [...p, { name: "", sets: 3, reps: "10", weight_suggestion_kg: "", notes: "" }]);
  }
  function updateExercise(i, field, val) {
    setExercises(p => p.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex));
  }
  function removeExercise(i) {
    setExercises(p => p.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        ...data,
        ...edited,
        estimated_duration: edited.estimated_duration ? Number(edited.estimated_duration) : null,
        exercises: exercises.filter(ex => ex.name.trim()).map(ex => ({
          name: ex.name,
          sets: ex.sets ? Number(ex.sets) : null,
          reps: ex.reps || null,
          weight_suggestion_kg: ex.weight_suggestion_kg ? Number(ex.weight_suggestion_kg) : null,
          notes: ex.notes || null,
        })),
      });
      setSaved(true);
    } catch (e) { alert(e.message); }
    setSaving(false);
  }

  return (
    <div className={`mt-2 rounded-xl border p-3 space-y-2 ${saved ? "border-emerald-700/50 bg-emerald-950/20" : "border-teal-700/50 bg-teal-950/20"}`}>
      <div className="flex items-center gap-2">
        <Dumbbell size={13} className={saved ? "text-emerald-400" : "text-teal-400"} />
        <span className="text-[11px] font-semibold text-slate-300">{saved ? "Workout Saved ✓" : "Save this workout?"}</span>
        {!saved && <button onClick={onDismiss} className="ml-auto text-slate-600 hover:text-slate-400"><X size={12} /></button>}
      </div>

      {!saved && (
        <>
          {/* Tab switcher */}
          <div className="flex bg-slate-800/60 rounded-lg p-0.5 gap-0.5">
            {["overview", "exercises"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1 rounded text-[10px] capitalize transition-all ${tab === t ? "bg-slate-700 text-slate-200" : "text-slate-500"}`}>
                {t}{t === "exercises" && exercises.length > 0 ? ` (${exercises.length})` : ""}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="bg-slate-800/60 rounded-lg p-2.5 space-y-2">
              <input value={edited.name} onChange={e => setEdited(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 ring-teal-500/50"
                placeholder="Workout name" />
              <div className="flex gap-1 flex-wrap">
                {WORKOUT_TYPES_CHAT.map(type => (
                  <button key={type} onClick={() => setEdited(p => ({ ...p, workout_type: type }))}
                    className={`px-2 py-0.5 rounded-full text-[9px] capitalize transition-all ${edited.workout_type === type ? "bg-teal-600/30 text-teal-300" : "bg-slate-700 text-slate-500"}`}>
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={edited.estimated_duration}
                  onChange={e => setEdited(p => ({ ...p, estimated_duration: e.target.value }))}
                  className="w-16 bg-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none" min={1} placeholder="60" />
                <span className="text-[10px] text-slate-500">min duration</span>
              </div>
              <textarea value={edited.description} onChange={e => setEdited(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Description (optional)"
                className="w-full bg-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none resize-none" />
            </div>
          )}

          {tab === "exercises" && (
            <div className="bg-slate-800/60 rounded-lg p-2.5 space-y-2">
              {exercises.length === 0 && (
                <p className="text-[11px] text-slate-500 text-center py-2">No exercises yet.</p>
              )}
              {exercises.map((ex, i) => (
                <div key={i} className="bg-slate-700/60 rounded-lg p-2 space-y-1.5">
                  <div className="flex gap-1.5">
                    <input value={ex.name} onChange={e => updateExercise(i, "name", e.target.value)}
                      placeholder="Exercise name" className="flex-1 bg-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none" />
                    <button onClick={() => removeExercise(i)} className="p-1 text-slate-600 hover:text-red-400"><Trash2 size={11} /></button>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-500">Sets</label>
                      <input type="number" value={ex.sets ?? ""} onChange={e => updateExercise(i, "sets", e.target.value)}
                        placeholder="3" min={1} className="w-full bg-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-500">Reps</label>
                      <input value={ex.reps ?? ""} onChange={e => updateExercise(i, "reps", e.target.value)}
                        placeholder="10" className="w-full bg-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-slate-500">kg</label>
                      <input type="number" value={ex.weight_suggestion_kg ?? ""} onChange={e => updateExercise(i, "weight_suggestion_kg", e.target.value)}
                        placeholder="BW" min={0} step={2.5} className="w-full bg-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addExercise} className="w-full py-1.5 text-[10px] text-slate-500 border border-dashed border-slate-700 rounded-lg hover:border-teal-700 hover:text-teal-400 flex items-center justify-center gap-1">
                <Plus size={10} /> Add exercise
              </button>
            </div>
          )}
        </>
      )}

      {saved && (
        <div className="bg-slate-800/60 rounded-lg p-2.5">
          <p className="text-sm font-medium text-slate-200">{edited.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] bg-teal-900/40 text-teal-300 px-1.5 py-0.5 rounded-full capitalize">{edited.workout_type}</span>
            {edited.estimated_duration && <span className="text-[10px] text-slate-500">{edited.estimated_duration} min</span>}
          </div>
        </div>
      )}

      {!saved && (
        <div className="flex gap-2">
          <button onClick={onDismiss} className="flex-1 py-1.5 text-[11px] text-slate-500 bg-slate-800/60 rounded-lg">Dismiss</button>
          <button onClick={handleSave} disabled={saving || !edited.name.trim()}
            className="flex-1 py-1.5 text-[11px] text-teal-300 bg-teal-600/20 rounded-lg hover:bg-teal-600/30 disabled:opacity-40 flex items-center justify-center gap-1">
            <CheckCircle size={11} />
            {saving ? "Saving…" : "Save Workout"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Router: picks the right card ─────────────────────────────────────────────
function ActionCard({ data, onSave, onDismiss }) {
  if (data.action_type === "save_meal_template")
    return <MealActionCard data={data} onSave={onSave} onDismiss={onDismiss} />;
  if (data.action_type === "add_schedule_event")
    return <ScheduleActionCard data={data} onSave={onSave} onDismiss={onDismiss} />;
  if (data.action_type === "save_workout_template")
    return <WorkoutTemplateCard data={data} onSave={onSave} onDismiss={onDismiss} />;
  return null;
}

export default function ChatPage() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [makeInitialMessage()];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    userAPI.getProfile().then(p => {
      const name = p.username || "there";
      setUsername(name);
      setMessages(prev => {
        if (prev.length === 1 && prev[0].role === "assistant" && prev[0].content.startsWith("Hey there!")) {
          return [makeInitialMessage(name)];
        }
        return prev;
      });
    }).catch(() => {});
  }, []);

  async function openHistory() {
    setShowHistory(true);
    setLoadingSessions(true);
    try {
      const data = await chatAPI.getSessions();
      setSessions(data);
    } catch { /* ignore */ }
    setLoadingSessions(false);
  }

  async function loadSession(id) {
    try {
      const s = await chatAPI.getSession(id);
      setMessages(s.messages);
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s.messages)); } catch {}
    } catch (e) { alert("Failed to load session: " + e.message); }
    setShowHistory(false);
  }

  async function deleteSession(id, e) {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch { /* ignore */ }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  async function sendMessage(text) {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
      const data = await aiAPI.chat(userMsg, history, "general");
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply,
        structured: data.structured_data,
      }]);
    } catch (err) {
      const msg = err.message?.includes("429")
        ? "You're sending messages too quickly. Please wait a moment."
        : err.message || "Something went wrong. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: msg }]);
    }

    setLoading(false);
  }

  function dismissAction(msgIndex) {
    setMessages(prev => prev.map((m, i) =>
      i === msgIndex ? { ...m, structured: null } : m
    ));
  }

  async function handleSaveAction(data) {
    if (data.action_type === "save_meal_template") {
      // I save as a reusable template and also log it for today
      const saved = await mealsAPI.saveTemplate({
        name: data.name,
        meal_type: data.meal_type,
        calories: Number(data.calories),
        protein_g: Number(data.protein_g),
        carbs_g: Number(data.carbs_g) || null,
        fat_g: Number(data.fat_g) || null,
        ingredients: data.ingredients || [],
        prep_instructions: data.prep_instructions,
      });
      await mealsAPI.logMeal({
        meal_type: data.meal_type,
        template_id: saved.id,
        name: data.name,
        calories: Number(data.calories),
        protein_g: Number(data.protein_g),
        carbs_g: Number(data.carbs_g) || null,
        fat_g: Number(data.fat_g) || null,
      });
    } else if (data.action_type === "add_schedule_event") {
      await scheduleAPI.create({
        title: data.title,
        event_type: data.event_type,
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
      });
    } else if (data.action_type === "save_workout_template") {
      await workoutAPI.saveTemplate({
        name: data.name,
        workout_type: data.workout_type,
        exercises: data.exercises || [],
        description: data.description,
        estimated_duration: data.estimated_duration,
        tags: data.tags || [],
      });
    }
  }

  async function newChat() {
    // I save the current session before clearing if there's real conversation
    const hasUserMessages = messages.some(m => m.role === "user");
    if (hasUserMessages) {
      try {
        // Strip structured data blobs before saving — they're not useful in history
        const clean = messages.map(({ role, content }) => ({ role, content }));
        await chatAPI.saveSession(clean);
      } catch { /* non-critical — continue anyway */ }
    }
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    setMessages([makeInitialMessage(username || "there")]);
  }

  return (
    <div className="flex flex-col h-[calc(100svh-4rem)] max-w-lg mx-auto relative overflow-hidden">
      {/* ─── History panel ────────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col">
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-slate-800">
            <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-slate-300">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-200">Chat History</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {loadingSessions && (
              <p className="text-[11px] text-slate-500 text-center py-6 animate-pulse">Loading…</p>
            )}
            {!loadingSessions && sessions.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center py-6">No saved sessions yet.<br />Start a chat, then tap New Chat to save it.</p>
            )}
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className="w-full text-left bg-slate-800/60 rounded-xl px-3 py-2.5 hover:bg-slate-700/60 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] text-slate-200 leading-snug line-clamp-2 flex-1">{s.title}</p>
                  <button
                    onClick={(e) => deleteSession(s.id, e)}
                    className="text-slate-600 hover:text-red-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {s.message_count} messages · {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-1.5">
            <Sparkles size={16} className="text-purple-400 flex-shrink-0" />
            AI Assistant
          </h1>
          <p className="text-[9px] text-slate-500 truncate">Vertex AI (Gemini 2.5) + RAG</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={openHistory}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-slate-500 bg-slate-800 rounded-lg hover:text-slate-300 transition-colors"
          >
            <History size={10} />
            History
          </button>
          <button
            onClick={newChat}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-slate-500 bg-slate-800 rounded-lg hover:text-slate-300 transition-colors"
          >
            <RotateCcw size={10} />
            New
          </button>
        </div>
      </div>

      <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => sendMessage(p)}
            className="flex-shrink-0 px-3 py-1.5 bg-bg-card rounded-full text-[10px] text-slate-400 hover:text-purple-300 hover:bg-purple-600/10 transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "user" ? "bg-blue-600/20" : "bg-purple-600/20"
            }`}>
              {msg.role === "user"
                ? <User size={14} className="text-blue-400" />
                : <Bot size={14} className="text-purple-400" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-blue-600/20 text-blue-100"
                : "bg-bg-card text-slate-300"
            }`}>
              {msg.role === "user"
                ? <p className="whitespace-pre-wrap">{msg.content}</p>
                : <FormattedText text={msg.content} />}
              {msg.structured?.action_type && (
                <ActionCard
                  data={msg.structured}
                  onSave={handleSaveAction}
                  onDismiss={() => dismissAction(i)}
                />
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Bot size={14} className="text-purple-400 animate-pulse" />
            </div>
            <div className="bg-bg-card rounded-xl px-3 py-2">
              <span className="text-sm text-slate-500 animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about meals, swaps, macros…"
            className="flex-1 bg-bg-card rounded-xl px-4 py-3 text-sm border border-slate-700 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-3 bg-purple-600/20 text-purple-400 rounded-xl hover:bg-purple-600/30 disabled:opacity-30"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
