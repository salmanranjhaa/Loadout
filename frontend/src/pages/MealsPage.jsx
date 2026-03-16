import { useState, useEffect } from "react";
import { Plus, RefreshCw, Flame, Beef, Check, Edit2, X, Trash2, ChevronDown, ChevronUp, Save, Pill } from "lucide-react";
import { mealsAPI, aiAPI, userAPI } from "../utils/api";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function MealsPage() {
  const [view, setView] = useState("today"); // "today" | "templates" | "manual"
  const [todayMeals, setTodayMeals] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [targets, setTargets] = useState({ calories: 2100, protein: 190 });
  const [supplements, setSupplements] = useState(null);

  // manual entry state
  const [manualInput, setManualInput] = useState("");
  const [manualResult, setManualResult] = useState(null);
  const [manualEdited, setManualEdited] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [confirmingLog, setConfirmingLog] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // template list state
  const [loggingId, setLoggingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingTId, setDeletingTId] = useState(null);
  const [deletingLogId, setDeletingLogId] = useState(null);

  const totalCals = todayMeals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalProtein = todayMeals.reduce((s, m) => s + (m.protein_g || 0), 0);
  const calPct = Math.min((totalCals / targets.calories) * 100, 100);
  const proPct = Math.min((totalProtein / targets.protein) * 100, 100);

  useEffect(() => {
    loadToday();
    loadTemplates();
    userAPI.getProfile().then(p => {
      setTargets({ calories: p.daily_calorie_target || 2100, protein: p.daily_protein_target || 190 });
      setSupplements(p.supplements);
    }).catch(() => {});
  }, []);

  async function loadToday() {
    try { const d = await mealsAPI.getToday(); setTodayMeals(d.meals); } catch { /* ignore */ }
  }

  async function loadTemplates() {
    try { const d = await mealsAPI.getTemplates(); setTemplates(d.templates); } catch { /* ignore */ }
  }

  async function logFromTemplate(template) {
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
      await loadToday();
      setView("today");
    } catch (e) { alert("Failed to log: " + e.message); }
    setLoggingId(null);
  }

  async function deleteLog(id) {
    setDeletingLogId(id);
    try { await mealsAPI.deleteLog(id); setTodayMeals(p => p.filter(m => m.id !== id)); }
    catch { /* ignore */ }
    setDeletingLogId(null);
  }

  function startEditTemplate(t) {
    setEditingId(t.id);
    setEditForm({
      name: t.name,
      meal_type: t.meal_type,
      calories: t.calories,
      protein_g: t.protein_g,
      carbs_g: t.carbs_g || "",
      fat_g: t.fat_g || "",
      ingredients: (t.ingredients || []).map(i => ({ ...i })),
    });
    setExpandedId(null);
  }

  async function saveEditTemplate() {
    setSavingEdit(true);
    try {
      const updated = await mealsAPI.updateTemplate(editingId, {
        name: editForm.name,
        meal_type: editForm.meal_type,
        calories: Number(editForm.calories),
        protein_g: Number(editForm.protein_g),
        carbs_g: editForm.carbs_g ? Number(editForm.carbs_g) : null,
        fat_g: editForm.fat_g ? Number(editForm.fat_g) : null,
        ingredients: editForm.ingredients.filter(i => i.name?.trim()),
      });
      setTemplates(p => p.map(t => t.id === editingId ? updated : t));
      setEditingId(null);
      setEditForm(null);
    } catch (e) { alert(e.message); }
    setSavingEdit(false);
  }

  async function deleteTemplate(id) {
    setDeletingTId(id);
    try {
      await mealsAPI.deleteTemplate(id);
      setTemplates(p => p.filter(t => t.id !== id));
    } catch { /* ignore */ }
    setDeletingTId(null);
  }

  async function estimateManual() {
    if (!manualInput.trim()) return;
    setEstimating(true);
    setManualResult(null);
    setManualEdited(null);
    try {
      const result = await aiAPI.estimateMacros(manualInput);
      setManualResult(result);
      setManualEdited({ ...result, meal_type: "custom" });
    } catch (e) { setManualResult({ error: e.message || "AI estimation failed" }); }
    setEstimating(false);
  }

  async function confirmLog(saveAsTemplate = false) {
    if (!manualEdited) return;
    saveAsTemplate ? setSavingTemplate(true) : setConfirmingLog(true);
    try {
      if (saveAsTemplate) {
        await mealsAPI.saveTemplate({
          name: manualEdited.name || manualInput.slice(0, 60),
          meal_type: manualEdited.meal_type || "custom",
          calories: Number(manualEdited.calories) || 0,
          protein_g: Number(manualEdited.protein_g) || 0,
          carbs_g: Number(manualEdited.carbs_g) || null,
          fat_g: Number(manualEdited.fat_g) || null,
          ingredients: manualResult?.ingredients || [],
        });
        await loadTemplates();
      }
      await mealsAPI.logMeal({
        meal_type: manualEdited.meal_type || "custom",
        name: manualEdited.name || manualInput.slice(0, 60),
        calories: Number(manualEdited.calories) || 0,
        protein_g: Number(manualEdited.protein_g) || 0,
        carbs_g: Number(manualEdited.carbs_g) || 0,
        fat_g: Number(manualEdited.fat_g) || 0,
      });
      setManualResult(null);
      setManualEdited(null);
      setManualInput("");
      await loadToday();
      setView("today");
    } catch (e) { alert("Failed: " + e.message); }
    setConfirmingLog(false);
    setSavingTemplate(false);
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent mb-1">
        Meal Plan
      </h1>

      {/* Daily progress */}
      <div className="bg-bg-card rounded-xl p-4 mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Today's Progress</span>
          <span>{todayMeals.length} meals logged</span>
        </div>
        <div className="mb-3">
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-amber-400 flex items-center gap-1"><Flame size={12} /> Calories</span>
            <span className="text-lg font-bold text-amber-400">{Math.round(totalCals)}<span className="text-xs text-slate-500 font-normal"> / {targets.calories}</span></span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all" style={{ width: `${calPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-xs text-emerald-400 flex items-center gap-1"><Beef size={12} /> Protein</span>
            <span className="text-lg font-bold text-emerald-400">{Math.round(totalProtein)}g<span className="text-xs text-slate-500 font-normal"> / {targets.protein}g</span></span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{ width: `${proPct}%` }} />
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {[
          { id: "today", label: "Today" },
          { id: "templates", label: "Quick Log" },
          { id: "manual", label: "Add Meal" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === t.id ? "bg-amber-600/20 text-amber-300 ring-1 ring-amber-500/40" : "bg-bg-card text-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Today's logged meals ─────────────────────────────────────────── */}
      {view === "today" && (
        <div className="space-y-2">
          {todayMeals.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No meals logged yet today.
              <p className="text-[11px] mt-1">Tap "Quick Log" to add from your saved meals.</p>
            </div>
          ) : (
            todayMeals.map((m) => (
              <div key={m.id} className="bg-bg-card rounded-lg p-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-200 truncate">{m.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 capitalize">{m.meal_type}</div>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-400">{m.calories} kcal</div>
                    <div className="text-[10px] text-emerald-400">{m.protein_g}g protein</div>
                  </div>
                  <button
                    onClick={() => deleteLog(m.id)}
                    disabled={deletingLogId === m.id}
                    className="p-1.5 text-slate-700 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Quick Log — saved templates ───────────────────────────────────── */}
      {view === "templates" && (
        <div className="space-y-2">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No saved meals yet.
              <p className="text-[11px] mt-1">Use AI Chat to generate meals, or use "Add Meal" to create one.</p>
            </div>
          ) : (
            templates.map(t => (
              <div key={t.id} className="bg-bg-card rounded-xl border border-slate-800 overflow-hidden">

                {editingId === t.id ? (
                  /* ── Inline edit form ── */
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1"><Edit2 size={11} /> Editing</span>
                      <button onClick={() => setEditingId(null)} className="text-slate-600 hover:text-slate-400"><X size={13} /></button>
                    </div>
                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-200 border border-slate-700 focus:border-amber-500 focus:outline-none" />
                    <div className="flex gap-1">
                      {MEAL_TYPES.map(type => (
                        <button key={type} onClick={() => setEditForm(p => ({ ...p, meal_type: type }))}
                          className={`flex-1 py-1 rounded text-[10px] capitalize transition-all ${editForm.meal_type === type ? "bg-amber-600/20 text-amber-300" : "bg-slate-800 text-slate-500"}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[["calories","kcal","text-amber-400"],["protein_g","g prot","text-emerald-400"],["carbs_g","g carbs","text-blue-400"],["fat_g","g fat","text-slate-400"]].map(([key, unit, color]) => (
                        <div key={key} className="flex items-center gap-1 bg-slate-800/60 rounded-lg px-2 py-1">
                          <input type="number" value={editForm[key] || ""} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-14 bg-transparent text-sm font-bold text-slate-200 focus:outline-none" min={0} />
                          <span className={`text-[9px] ${color}`}>{unit}</span>
                        </div>
                      ))}
                    </div>
                    {/* Ingredient list */}
                    <div className="space-y-1">
                      {editForm.ingredients.map((ing, i) => (
                        <div key={i} className="flex gap-1.5 items-center">
                          <input value={ing.amount || ""} onChange={e => setEditForm(p => ({ ...p, ingredients: p.ingredients.map((x, j) => j === i ? { ...x, amount: e.target.value } : x) }))}
                            placeholder="qty" className="w-14 bg-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none" />
                          <input value={ing.name || ""} onChange={e => setEditForm(p => ({ ...p, ingredients: p.ingredients.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))}
                            placeholder="ingredient" className="flex-1 bg-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none" />
                          <button onClick={() => setEditForm(p => ({ ...p, ingredients: p.ingredients.filter((_, j) => j !== i) }))} className="p-0.5 text-slate-600 hover:text-red-400"><Trash2 size={11} /></button>
                        </div>
                      ))}
                      <button onClick={() => setEditForm(p => ({ ...p, ingredients: [...p.ingredients, { name: "", amount: "" }] }))}
                        className="w-full py-1 text-[10px] text-slate-500 border border-dashed border-slate-700 rounded hover:border-amber-700 hover:text-amber-400 flex items-center justify-center gap-1">
                        <Plus size={10} /> Add ingredient
                      </button>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 bg-slate-800 text-slate-500 rounded-lg text-xs">Cancel</button>
                      <button onClick={saveEditTemplate} disabled={savingEdit}
                        className="flex-1 py-1.5 bg-amber-600/20 text-amber-300 rounded-lg text-xs font-medium hover:bg-amber-600/30 disabled:opacity-40 flex items-center justify-center gap-1">
                        <Save size={11} />
                        {savingEdit ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal view ── */
                  <>
                    <div className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(e => e === t.id ? null : t.id)}>
                        <div className="text-sm font-medium text-slate-200 truncate">{t.name}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{t.meal_type} · {t.calories} kcal · {t.protein_g}g prot</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEditTemplate(t)} className="p-1.5 text-slate-600 hover:text-amber-400 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => deleteTemplate(t.id)} disabled={deletingTId === t.id}
                          className="p-1.5 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"><Trash2 size={13} /></button>
                        <button onClick={() => logFromTemplate(t)} disabled={loggingId === t.id}
                          className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 disabled:opacity-40">
                          {loggingId === t.id ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                        </button>
                        <button onClick={() => setExpandedId(e => e === t.id ? null : t.id)} className="p-1">
                          {expandedId === t.id ? <ChevronUp size={12} className="text-slate-600" /> : <ChevronDown size={12} className="text-slate-600" />}
                        </button>
                      </div>
                    </div>

                    {expandedId === t.id && (
                      <div className="px-3 pb-3 border-t border-slate-800 pt-2 space-y-1.5">
                        <div className="flex gap-3 text-[11px]">
                          {t.carbs_g && <span className="text-blue-400">{t.carbs_g}g carbs</span>}
                          {t.fat_g && <span className="text-slate-400">{t.fat_g}g fat</span>}
                        </div>
                        {t.ingredients?.length > 0 && (
                          <div className="space-y-0.5">
                            {t.ingredients.map((ing, i) => (
                              <div key={i} className="text-[11px] text-slate-400">
                                {ing.amount ? `${ing.amount} ` : ""}{ing.name}
                              </div>
                            ))}
                          </div>
                        )}
                        {t.prep_instructions && <p className="text-[11px] text-slate-500 italic">{t.prep_instructions}</p>}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Add Meal (AI macro estimation) ────────────────────────────────── */}
      {view === "manual" && (
        <div className="space-y-3">
          <div className="bg-bg-card rounded-lg p-4">
            <label className="text-xs text-slate-500 block mb-2">Describe what you ate — ingredients, quantities, cooking method:</label>
            <textarea
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="e.g. 200g grilled chicken, 150g basmati rice, salad with feta…"
              className="w-full bg-slate-800 rounded-lg p-3 text-sm text-slate-200 border border-slate-700 focus:border-amber-500 focus:outline-none resize-none"
              rows={3}
            />
            <button
              onClick={estimateManual}
              disabled={estimating || !manualInput.trim()}
              className="mt-2 w-full py-2.5 bg-amber-600/20 text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-600/30 disabled:opacity-40"
            >
              {estimating ? "Estimating…" : "Estimate Macros with AI"}
            </button>
          </div>

          {manualEdited && !manualResult?.error && (
            <div className="bg-bg-card rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Edit2 size={12} className="text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">AI Estimate — edit if needed</span>
              </div>
              <input
                value={manualEdited.name || ""}
                onChange={e => setManualEdited(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-amber-500 focus:outline-none"
                placeholder="Meal name"
              />
              <div className="flex gap-1.5">
                {MEAL_TYPES.map(type => (
                  <button key={type} onClick={() => setManualEdited(p => ({ ...p, meal_type: type }))}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] capitalize transition-all ${
                      manualEdited.meal_type === type ? "bg-amber-600/20 text-amber-300 ring-1 ring-amber-500/40" : "bg-slate-800 text-slate-500"
                    }`}>
                    {type}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "calories", label: "Calories", color: "text-amber-400", unit: "kcal" },
                  { key: "protein_g", label: "Protein", color: "text-emerald-400", unit: "g" },
                  { key: "carbs_g", label: "Carbs", color: "text-blue-400", unit: "g" },
                  { key: "fat_g", label: "Fat", color: "text-purple-400", unit: "g" },
                ].map(({ key, label, color, unit }) => (
                  <div key={key} className="bg-slate-800/60 rounded-lg p-2">
                    <div className={`text-[10px] ${color} mb-1`}>{label} ({unit})</div>
                    <input type="number" value={manualEdited[key] || ""}
                      onChange={e => setManualEdited(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full bg-transparent text-sm font-bold text-slate-200 focus:outline-none" min={0} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setManualResult(null); setManualEdited(null); }}
                  className="px-3 py-2 bg-slate-700/50 text-slate-400 rounded-lg text-sm">
                  Discard
                </button>
                <button onClick={() => confirmLog(false)} disabled={confirmingLog || savingTemplate}
                  className="flex-1 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700 disabled:opacity-40 flex items-center justify-center gap-1.5">
                  <Check size={13} />
                  {confirmingLog ? "Logging…" : "Log Only"}
                </button>
                <button onClick={() => confirmLog(true)} disabled={confirmingLog || savingTemplate}
                  className="flex-1 py-2 bg-emerald-600/20 text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-600/30 disabled:opacity-40 flex items-center justify-center gap-1.5">
                  <Save size={13} />
                  {savingTemplate ? "Saving…" : "Log + Save"}
                </button>
              </div>
            </div>
          )}

          {manualResult?.error && (
            <p className="text-xs text-red-400 bg-red-950/20 rounded-lg p-3">{manualResult.error}</p>
          )}
        </div>
      )}

      {/* Supplement schedule — collapsible */}
      <SupplementSection supplements={supplements} />
    </div>
  );
}

function SupRow({ label, items }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-slate-800/60 last:border-0">
      <span className="w-24 text-slate-500 flex-shrink-0 capitalize text-[11px]">{label}</span>
      <span className="text-slate-300 text-[11px]">{Array.isArray(items) ? items.join(", ") : items}</span>
    </div>
  );
}

function SupplementSection({ supplements }) {
  const [open, setOpen] = useState(false);

  const fallback = [
    { time: "Morning", items: "Apple cider vinegar, Magnesium, Multivitamin" },
    { time: "Pre workout", items: "L-carnitine, Black coffee" },
    { time: "Post workout", items: "Whey protein shake (30g)" },
    { time: "Before bed", items: "Magnesium" },
  ];

  return (
    <div className="mt-4 bg-bg-card rounded-xl border border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Pill size={13} className="text-purple-400" />
          <span className="text-xs font-semibold text-slate-400">Supplement Schedule</span>
        </div>
        {open ? <ChevronUp size={13} className="text-slate-600" /> : <ChevronDown size={13} className="text-slate-600" />}
      </button>

      {open && (
        <div className="px-4 pb-3 border-t border-slate-800">
          <div className="space-y-0 mt-2 text-xs">
            {supplements ? (
              <>
                {supplements.morning?.length > 0 && <SupRow label="Morning" items={supplements.morning} />}
                {supplements.pre_workout?.length > 0 && <SupRow label="Pre workout" items={supplements.pre_workout} />}
                {supplements.post_workout?.length > 0 && <SupRow label="Post workout" items={supplements.post_workout} />}
                {supplements.before_bed?.length > 0 && <SupRow label="Before bed" items={supplements.before_bed} />}
              </>
            ) : (
              fallback.map((s, i) => <SupRow key={i} label={s.time} items={s.items} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
