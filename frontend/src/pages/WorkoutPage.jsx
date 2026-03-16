import { useState, useEffect, useRef } from "react";
import { Zap, Clock, Flame, Activity, ChevronDown, ChevronUp, Trash2, Brain, Plus, Minus, CheckCircle, Dumbbell, BookOpen, Play, X, Edit2 } from "lucide-react";
import { workoutAPI } from "../utils/api";

// ─── Cardio / sports ────────────────────────────────────────────────────────

const CARDIO_TYPES = [
  { id: "crossfit", label: "CrossFit", emoji: "🏋️" },
  { id: "running", label: "Running", emoji: "🏃" },
  { id: "football", label: "Football", emoji: "⚽" },
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "cycling", label: "Cycling", emoji: "🚴" },
  { id: "stretch", label: "Stretch", emoji: "🤸" },
  { id: "swimming", label: "Swimming", emoji: "🏊" },
  { id: "hiit", label: "HIIT", emoji: "💥" },
  { id: "walking", label: "Walking", emoji: "🚶" },
  { id: "boxing", label: "Boxing", emoji: "🥊" },
  { id: "pilates", label: "Pilates", emoji: "🪢" },
  { id: "climbing", label: "Climbing", emoji: "🧗" },
];

const INTENSITY_OPTIONS = [
  { id: "low", label: "Low", color: "text-emerald-400", ring: "ring-emerald-500/50", bg: "bg-emerald-950/30" },
  { id: "moderate", label: "Moderate", color: "text-amber-400", ring: "ring-amber-500/50", bg: "bg-amber-950/30" },
  { id: "high", label: "High", color: "text-red-400", ring: "ring-red-500/50", bg: "bg-red-950/30" },
];

// I define activity-specific extra fields so users can log metrics from Strava/watches
const CARDIO_EXTRA_FIELDS = {
  running: [
    { key: "distance_km", label: "Distance", unit: "km", step: 0.1 },
    { key: "avg_pace_min_km", label: "Avg Pace", unit: "min/km", step: 0.1 },
    { key: "avg_hr_bpm", label: "Avg HR", unit: "bpm", step: 1 },
    { key: "elevation_m", label: "Elevation", unit: "m", step: 1 },
  ],
  cycling: [
    { key: "distance_km", label: "Distance", unit: "km", step: 0.1 },
    { key: "avg_speed_kmh", label: "Avg Speed", unit: "km/h", step: 0.1 },
    { key: "avg_hr_bpm", label: "Avg HR", unit: "bpm", step: 1 },
    { key: "elevation_m", label: "Elevation", unit: "m", step: 1 },
  ],
  swimming: [
    { key: "distance_m", label: "Distance", unit: "m", step: 25 },
    { key: "avg_hr_bpm", label: "Avg HR", unit: "bpm", step: 1 },
  ],
  walking: [
    { key: "distance_km", label: "Distance", unit: "km", step: 0.1 },
    { key: "steps", label: "Steps", unit: "", step: 100 },
  ],
  football: [
    { key: "avg_hr_bpm", label: "Avg HR", unit: "bpm", step: 1 },
    { key: "calories_burned", label: "Calories", unit: "kcal", step: 10 },
  ],
  crossfit: [
    { key: "avg_hr_bpm", label: "Avg HR", unit: "bpm", step: 1 },
    { key: "calories_burned", label: "Calories", unit: "kcal", step: 10 },
  ],
  hiit: [
    { key: "avg_hr_bpm", label: "Avg HR", unit: "bpm", step: 1 },
    { key: "calories_burned", label: "Calories", unit: "kcal", step: 10 },
  ],
  boxing: [
    { key: "rounds", label: "Rounds", unit: "", step: 1 },
    { key: "avg_hr_bpm", label: "Avg HR", unit: "bpm", step: 1 },
  ],
  climbing: [
    { key: "routes_completed", label: "Routes", unit: "", step: 1 },
    { key: "avg_hr_bpm", label: "Avg HR", unit: "bpm", step: 1 },
  ],
};

// ─── Strength exercise library ───────────────────────────────────────────────

const MUSCLE_GROUPS = ["All", "Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Core", "Full Body"];

// exType: "weighted" = reps+kg, "bodyweight" = reps only, "timed" = hold duration in secs
const EXERCISE_LIBRARY = [
  // Chest
  { id: "bench_press", name: "Bench Press", muscle: "Chest", emoji: "🏋️", exType: "weighted" },
  { id: "incline_press", name: "Incline Press", muscle: "Chest", emoji: "🏋️", exType: "weighted" },
  { id: "push_up", name: "Push Up", muscle: "Chest", emoji: "💪", exType: "bodyweight" },
  { id: "cable_fly", name: "Cable Fly", muscle: "Chest", emoji: "🤸", exType: "weighted" },
  { id: "dips", name: "Chest Dips", muscle: "Chest", emoji: "💪", exType: "bodyweight" },
  // Back
  { id: "pull_up", name: "Pull Up", muscle: "Back", emoji: "🏋️", exType: "bodyweight" },
  { id: "bent_row", name: "Bent Over Row", muscle: "Back", emoji: "🏋️", exType: "weighted" },
  { id: "lat_pulldown", name: "Lat Pulldown", muscle: "Back", emoji: "🏋️", exType: "weighted" },
  { id: "cable_row", name: "Seated Cable Row", muscle: "Back", emoji: "🏋️", exType: "weighted" },
  { id: "deadlift", name: "Deadlift", muscle: "Back", emoji: "🏋️", exType: "weighted" },
  // Shoulders
  { id: "ohp", name: "Overhead Press", muscle: "Shoulders", emoji: "🏋️", exType: "weighted" },
  { id: "lateral_raise", name: "Lateral Raise", muscle: "Shoulders", emoji: "💪", exType: "weighted" },
  { id: "front_raise", name: "Front Raise", muscle: "Shoulders", emoji: "💪", exType: "weighted" },
  { id: "face_pull", name: "Face Pull", muscle: "Shoulders", emoji: "🤸", exType: "weighted" },
  // Biceps
  { id: "barbell_curl", name: "Barbell Curl", muscle: "Biceps", emoji: "💪", exType: "weighted" },
  { id: "hammer_curl", name: "Hammer Curl", muscle: "Biceps", emoji: "💪", exType: "weighted" },
  { id: "incline_curl", name: "Incline DB Curl", muscle: "Biceps", emoji: "💪", exType: "weighted" },
  { id: "preacher_curl", name: "Preacher Curl", muscle: "Biceps", emoji: "💪", exType: "weighted" },
  // Triceps
  { id: "tricep_pushdown", name: "Tricep Pushdown", muscle: "Triceps", emoji: "💪", exType: "weighted" },
  { id: "skull_crusher", name: "Skull Crusher", muscle: "Triceps", emoji: "🏋️", exType: "weighted" },
  { id: "overhead_ext", name: "Overhead Extension", muscle: "Triceps", emoji: "💪", exType: "weighted" },
  { id: "close_grip", name: "Close Grip Bench", muscle: "Triceps", emoji: "🏋️", exType: "weighted" },
  // Legs
  { id: "squat", name: "Back Squat", muscle: "Legs", emoji: "🏋️", exType: "weighted" },
  { id: "rdl", name: "Romanian Deadlift", muscle: "Legs", emoji: "🏋️", exType: "weighted" },
  { id: "leg_press", name: "Leg Press", muscle: "Legs", emoji: "🏋️", exType: "weighted" },
  { id: "lunges", name: "Lunges", muscle: "Legs", emoji: "🤸", exType: "bodyweight" },
  { id: "leg_curl", name: "Leg Curl", muscle: "Legs", emoji: "🏋️", exType: "weighted" },
  { id: "calf_raise", name: "Calf Raise", muscle: "Legs", emoji: "🦵", exType: "weighted" },
  { id: "leg_ext", name: "Leg Extension", muscle: "Legs", emoji: "🏋️", exType: "weighted" },
  // Core
  { id: "plank", name: "Plank", muscle: "Core", emoji: "🤸", exType: "timed" },
  { id: "side_plank", name: "Side Plank", muscle: "Core", emoji: "🤸", exType: "timed" },
  { id: "crunch", name: "Crunch", muscle: "Core", emoji: "🤸", exType: "bodyweight" },
  { id: "leg_raise", name: "Hanging Leg Raise", muscle: "Core", emoji: "🤸", exType: "bodyweight" },
  { id: "russian_twist", name: "Russian Twist", muscle: "Core", emoji: "🔄", exType: "bodyweight" },
  { id: "ab_wheel", name: "Ab Wheel", muscle: "Core", emoji: "⚙️", exType: "bodyweight" },
  // Full Body
  { id: "power_clean", name: "Power Clean", muscle: "Full Body", emoji: "🏋️", exType: "weighted" },
  { id: "thruster", name: "Thruster", muscle: "Full Body", emoji: "🏋️", exType: "weighted" },
  { id: "burpee", name: "Burpee", muscle: "Full Body", emoji: "💥", exType: "bodyweight" },
  { id: "kettlebell_swing", name: "KB Swing", muscle: "Full Body", emoji: "🔔", exType: "weighted" },
];

// ─── Shared history item ─────────────────────────────────────────────────────

function WorkoutHistoryItem({ w, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isStrength = w.type === "strength";
  const emoji = isStrength ? "🏋️" : (CARDIO_TYPES.find(t => t.id === w.type)?.emoji || "🏃");
  const hasDetail = w.ai_analysis || (isStrength && w.details?.exercises);

  return (
    <div className="bg-bg-card rounded-xl border border-slate-800 overflow-hidden">
      <div
        className="p-3 flex items-center justify-between cursor-pointer"
        onClick={() => hasDetail && setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{emoji}</span>
          <div>
            <span className="text-sm font-medium text-slate-200 capitalize">{w.type}</span>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-slate-500">{w.date}</span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-slate-500">{w.duration}min</span>
              {w.calories > 0 && (
                <><span className="text-[10px] text-slate-600">·</span>
                <span className="text-[10px] text-amber-500">{w.calories} kcal</span></>
              )}
              {w.intensity && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize ${
                  w.intensity === "high" ? "bg-red-900/40 text-red-400" :
                  w.intensity === "moderate" ? "bg-amber-900/40 text-amber-400" :
                  "bg-emerald-900/40 text-emerald-400"
                }`}>{w.intensity}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasDetail && (expanded ? <ChevronUp size={12} className="text-slate-600" /> : <ChevronDown size={12} className="text-slate-600" />)}
          <button onClick={e => { e.stopPropagation(); onDelete(w.id); }} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-800 pt-3 space-y-3">
          {/* Strength exercises detail */}
          {isStrength && w.details?.exercises && (
            <div className="space-y-2">
              {w.details.exercises.map((ex, i) => (
                <div key={i} className="bg-slate-800/60 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <p className="text-xs font-medium text-slate-200">{ex.name}</p>
                    {ex.muscle && <span className="text-[9px] text-slate-500">· {ex.muscle}</span>}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {ex.sets.map((s, j) => (
                      <span key={j} className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                        {j + 1}: {s.reps} reps{s.weight > 0 ? ` × ${s.weight}kg` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI analysis for cardio */}
          {w.ai_analysis && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/60 rounded-lg p-2 text-center">
                  <div className="text-base font-bold text-amber-400">{w.ai_analysis.calories_burned ?? "—"}</div>
                  <div className="text-[9px] text-slate-500">kcal burned</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2 text-center">
                  <div className="text-base font-bold text-blue-400">{w.ai_analysis.recovery_hours ?? "—"}h</div>
                  <div className="text-[9px] text-slate-500">recovery</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2 text-center">
                  <div className="text-base font-bold text-emerald-400">{w.ai_analysis.intensity_score ?? "—"}/10</div>
                  <div className="text-[9px] text-slate-500">intensity</div>
                </div>
              </div>

              {w.ai_analysis.muscle_groups?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {w.ai_analysis.muscle_groups.map(m => (
                    <span key={m} className="text-[10px] bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded-full capitalize">{m}</span>
                  ))}
                </div>
              )}

              {w.ai_analysis.notes && (
                <p className="text-xs text-slate-400 leading-relaxed">{w.ai_analysis.notes}</p>
              )}
              {w.ai_analysis.weekly_impact && (
                <p className="text-[10px] text-slate-500 italic">{w.ai_analysis.weekly_impact}</p>
              )}
            </div>
          )}

          {/* Plain notes for cardio without AI analysis */}
          {!isStrength && !w.ai_analysis && w.notes && (
            <p className="text-xs text-slate-400">{w.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI analysis card ────────────────────────────────────────────────────────

function AnalysisCard({ analysis }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 space-y-3">
      <div className="flex items-center gap-2">
        <Brain size={13} className="text-purple-400" />
        <span className="text-xs font-semibold text-purple-400">AI Analysis</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-lg font-bold text-amber-400">{analysis.calories_burned ?? "—"}</div>
          <div className="text-[10px] text-slate-500">kcal burned</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{analysis.recovery_hours ?? "—"}h</div>
          <div className="text-[10px] text-slate-500">recovery</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-400">{analysis.intensity_score ?? "—"}/10</div>
          <div className="text-[10px] text-slate-500">intensity</div>
        </div>
      </div>
      {analysis.muscle_groups?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.muscle_groups.map(m => (
            <span key={m} className="text-[10px] bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded-full capitalize">{m}</span>
          ))}
        </div>
      )}
      {analysis.notes && (
        <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700 pt-2">{analysis.notes}</p>
      )}
    </div>
  );
}

// ─── Strength Training tab ───────────────────────────────────────────────────

function StrengthTab({ onSaved }) {
  const [muscleFilter, setMuscleFilter] = useState("All");
  const [session, setSession] = useState([]); // [{ exercise, sets: [{ reps, weight }] }]
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLibrary, setShowLibrary] = useState(true);

  const filtered = muscleFilter === "All"
    ? EXERCISE_LIBRARY
    : EXERCISE_LIBRARY.filter(e => e.muscle === muscleFilter);

  function addExercise(ex) {
    if (session.find(s => s.exercise.id === ex.id)) return;
    const initialSet = ex.exType === "timed"
      ? { duration_secs: 30 }
      : ex.exType === "bodyweight"
        ? { reps: 10 }
        : { reps: 10, weight: 0 };
    setSession(prev => [...prev, { exercise: ex, sets: [initialSet] }]);
    setShowLibrary(false);
  }

  function removeExercise(exId) {
    setSession(prev => prev.filter(s => s.exercise.id !== exId));
  }

  function addSet(exId) {
    setSession(prev => prev.map(s => {
      if (s.exercise.id !== exId) return s;
      const last = s.sets.at(-1) || {};
      const newSet = s.exercise.exType === "timed"
        ? { duration_secs: last.duration_secs || 30 }
        : s.exercise.exType === "bodyweight"
          ? { reps: last.reps || 10 }
          : { reps: last.reps || 10, weight: last.weight || 0 };
      return { ...s, sets: [...s.sets, newSet] };
    }));
  }

  function removeSet(exId, setIdx) {
    setSession(prev => prev.map(s =>
      s.exercise.id === exId
        ? { ...s, sets: s.sets.filter((_, i) => i !== setIdx) }
        : s
    ));
  }

  function updateSet(exId, setIdx, field, value) {
    setSession(prev => prev.map(s =>
      s.exercise.id === exId
        ? { ...s, sets: s.sets.map((set, i) => i === setIdx ? { ...set, [field]: Number(value) || 0 } : set) }
        : s
    ));
  }

  const totalSets = session.reduce((acc, s) => acc + s.sets.length, 0);
  const totalVolume = session.reduce((acc, s) =>
    s.exercise.exType === "weighted"
      ? acc + s.sets.reduce((a, set) => a + (set.reps * (set.weight || 0)), 0)
      : acc, 0
  );

  async function handleSave() {
    if (!session.length) return;
    setSaving(true);
    const totalDuration = Math.max(session.length * 15, 30);
    const notes = JSON.stringify({ exercises: session.map(s => ({ name: s.exercise.name, sets: s.sets })) });
    try {
      await workoutAPI.save({
        workout_type: "strength",
        duration_minutes: totalDuration,
        intensity: totalVolume > 5000 ? "high" : totalVolume > 2000 ? "moderate" : "low",
        description: notes,
        details: { exercises: session.map(s => ({ name: s.exercise.name, muscle: s.exercise.muscle, sets: s.sets })) },
      });
      setSaved(true);
      setSession([]);
      setShowLibrary(true);
      onSaved?.();
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Session summary bar */}
      {session.length > 0 && (
        <div className="bg-bg-card rounded-xl p-3 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-sm font-bold text-emerald-400">{session.length}</div>
              <div className="text-[9px] text-slate-500">exercises</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-blue-400">{totalSets}</div>
              <div className="text-[9px] text-slate-500">total sets</div>
            </div>
            {totalVolume > 0 && (
              <div className="text-center">
                <div className="text-sm font-bold text-amber-400">{totalVolume.toLocaleString()}</div>
                <div className="text-[9px] text-slate-500">kg volume</div>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-emerald-600/20 text-emerald-300 rounded-xl text-xs font-medium hover:bg-emerald-600/30 disabled:opacity-40 flex items-center gap-1.5"
          >
            <CheckCircle size={13} />
            {saving ? "Saving…" : "Finish Session"}
          </button>
        </div>
      )}

      {saved && (
        <p className="text-xs text-emerald-400 text-center bg-emerald-950/30 rounded-lg p-2">
          ✓ Strength session saved!
        </p>
      )}

      {/* Active session exercises */}
      {session.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Session</h3>
            <button
              onClick={() => setShowLibrary(v => !v)}
              className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <Plus size={11} /> Add exercise
            </button>
          </div>

          {session.map(({ exercise, sets }) => (
            <div key={exercise.id} className="bg-bg-card rounded-xl border border-slate-800 overflow-hidden">
              {/* Exercise header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">{exercise.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{exercise.name}</p>
                    <p className="text-[10px] text-slate-500">{exercise.muscle}</p>
                  </div>
                </div>
                <button onClick={() => removeExercise(exercise.id)} className="p-1 text-slate-700 hover:text-red-400">
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Sets */}
              <div className="px-3 py-2 space-y-1.5">
                {/* Column headers — adapt to exercise type */}
                {exercise.exType === "timed" ? (
                  <div className="grid grid-cols-[32px_1fr_28px] gap-2 px-1">
                    <span className="text-[9px] text-slate-600 text-center">SET</span>
                    <span className="text-[9px] text-slate-600 text-center">SECS</span>
                    <span />
                  </div>
                ) : exercise.exType === "bodyweight" ? (
                  <div className="grid grid-cols-[32px_1fr_28px] gap-2 px-1">
                    <span className="text-[9px] text-slate-600 text-center">SET</span>
                    <span className="text-[9px] text-slate-600 text-center">REPS</span>
                    <span />
                  </div>
                ) : (
                  <div className="grid grid-cols-[32px_1fr_1fr_28px] gap-2 px-1">
                    <span className="text-[9px] text-slate-600 text-center">SET</span>
                    <span className="text-[9px] text-slate-600 text-center">REPS</span>
                    <span className="text-[9px] text-slate-600 text-center">KG</span>
                    <span />
                  </div>
                )}

                {sets.map((set, si) => (
                  exercise.exType === "timed" ? (
                    <div key={si} className="grid grid-cols-[32px_1fr_28px] gap-2 items-center">
                      <span className="text-[11px] text-slate-500 text-center font-mono">{si + 1}</span>
                      <input
                        type="number"
                        value={set.duration_secs || 30}
                        onChange={e => updateSet(exercise.id, si, "duration_secs", e.target.value)}
                        className="bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-slate-200 border border-slate-700 focus:border-emerald-500 focus:outline-none w-full"
                        min={5} step={5}
                      />
                      <button onClick={() => sets.length > 1 ? removeSet(exercise.id, si) : null}
                        className="p-1 text-slate-700 hover:text-red-400 transition-colors mx-auto">
                        <Minus size={11} />
                      </button>
                    </div>
                  ) : exercise.exType === "bodyweight" ? (
                    <div key={si} className="grid grid-cols-[32px_1fr_28px] gap-2 items-center">
                      <span className="text-[11px] text-slate-500 text-center font-mono">{si + 1}</span>
                      <input
                        type="number"
                        value={set.reps || 10}
                        onChange={e => updateSet(exercise.id, si, "reps", e.target.value)}
                        className="bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-slate-200 border border-slate-700 focus:border-emerald-500 focus:outline-none w-full"
                        min={1}
                      />
                      <button onClick={() => sets.length > 1 ? removeSet(exercise.id, si) : null}
                        className="p-1 text-slate-700 hover:text-red-400 transition-colors mx-auto">
                        <Minus size={11} />
                      </button>
                    </div>
                  ) : (
                    <div key={si} className="grid grid-cols-[32px_1fr_1fr_28px] gap-2 items-center">
                      <span className="text-[11px] text-slate-500 text-center font-mono">{si + 1}</span>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => updateSet(exercise.id, si, "reps", e.target.value)}
                        className="bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-slate-200 border border-slate-700 focus:border-emerald-500 focus:outline-none w-full"
                        min={1}
                      />
                      <input
                        type="number"
                        value={set.weight || ""}
                        onChange={e => updateSet(exercise.id, si, "weight", e.target.value)}
                        placeholder="BW"
                        className="bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-center text-slate-200 border border-slate-700 focus:border-emerald-500 focus:outline-none w-full placeholder-slate-600"
                        min={0} step={2.5}
                      />
                      <button onClick={() => sets.length > 1 ? removeSet(exercise.id, si) : null}
                        className="p-1 text-slate-700 hover:text-red-400 transition-colors mx-auto">
                        <Minus size={11} />
                      </button>
                    </div>
                  )
                ))}

                <button
                  onClick={() => addSet(exercise.id)}
                  className="w-full py-1.5 text-[11px] text-slate-500 hover:text-emerald-400 border border-dashed border-slate-700 hover:border-emerald-700 rounded-lg transition-colors flex items-center justify-center gap-1 mt-1"
                >
                  <Plus size={11} /> Add set
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise library */}
      {(showLibrary || session.length === 0) && (
        <div className="bg-bg-card rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-800">
            <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Dumbbell size={14} className="text-purple-400" />
              Exercise Library
            </p>
          </div>

          {/* Muscle filter */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-800">
            {MUSCLE_GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setMuscleFilter(g)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] transition-all ${
                  muscleFilter === g
                    ? "bg-purple-600/30 text-purple-300 ring-1 ring-purple-500/50"
                    : "bg-slate-800 text-slate-500 hover:text-slate-300"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Exercise grid */}
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {filtered.map(ex => {
              const inSession = session.find(s => s.exercise.id === ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex)}
                  disabled={!!inSession}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition-all ${
                    inSession
                      ? "bg-emerald-950/20 border border-emerald-800/40 opacity-60"
                      : "bg-slate-800/60 hover:bg-slate-800 border border-transparent hover:border-slate-700"
                  }`}
                >
                  <span className="text-base flex-shrink-0">{ex.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-slate-200 leading-tight truncate">{ex.name}</p>
                    <p className="text-[9px] text-slate-500">{ex.muscle}</p>
                  </div>
                  {inSession && <CheckCircle size={12} className="text-emerald-400 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cardio tab ──────────────────────────────────────────────────────────────

function CardioTab({ onSaved }) {
  const [selectedType, setSelectedType] = useState("running");
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState("moderate");
  const [description, setDescription] = useState("");
  const [cardioDetails, setCardioDetails] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const extraFields = CARDIO_EXTRA_FIELDS[selectedType] || [];

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalysis(null);
    setSaved(false);
    try {
      const result = await workoutAPI.analyze({ workout_type: selectedType, duration_minutes: duration, intensity, description });
      setAnalysis(result);
    } catch (e) {
      setAnalysis({ notes: e.message || "Analysis failed", calories_burned: null });
    }
    setAnalyzing(false);
  }

  async function handleSave() {
    setSaving(true);
    // I merge any manually entered calories from cardioDetails into calories_burned_est
    const calsBurned = cardioDetails.calories_burned
      ? parseInt(cardioDetails.calories_burned)
      : analysis?.calories_burned;
    try {
      await workoutAPI.save({
        workout_type: selectedType,
        duration_minutes: duration,
        intensity,
        description,
        ai_analysis: analysis,
        calories_burned_est: calsBurned,
        details: Object.keys(cardioDetails).length > 0 ? cardioDetails : undefined,
      });
      setSaved(true);
      setAnalysis(null);
      setDescription("");
      setCardioDetails({});
      onSaved?.();
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  return (
    <div className="bg-bg-card rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">Log Workout</h3>

      <div className="grid grid-cols-4 gap-1.5">
        {CARDIO_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => { setSelectedType(t.id); setAnalysis(null); setSaved(false); setCardioDetails({}); }}
            className={`flex flex-col items-center py-2 rounded-lg text-[11px] transition-all ${
              selectedType === t.id
                ? "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/50"
                : "bg-slate-800/60 text-slate-500 hover:text-slate-300"
            }`}
          >
            <span className="text-base mb-0.5">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-slate-400">Duration</label>
          <span className="text-sm font-semibold text-slate-200">{duration} min</span>
        </div>
        <input
          type="range" min={5} max={180} step={5}
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
          <span>5</span><span>45</span><span>90</span><span>135</span><span>180</span>
        </div>
      </div>

      <div className="flex gap-2">
        {INTENSITY_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setIntensity(opt.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              intensity === opt.id
                ? `${opt.bg} ${opt.color} ring-1 ${opt.ring}`
                : "bg-slate-800/60 text-slate-500"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Activity-specific metrics */}
      {extraFields.length > 0 && (
        <div className="bg-slate-800/40 rounded-xl p-3 space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Activity Metrics (optional)</p>
          <div className="grid grid-cols-2 gap-2">
            {extraFields.map(f => (
              <div key={f.key}>
                <label className="text-[10px] text-slate-500 mb-0.5 block">
                  {f.label}{f.unit ? ` (${f.unit})` : ""}
                </label>
                <input
                  type="number"
                  value={cardioDetails[f.key] || ""}
                  onChange={e => setCardioDetails(p => ({ ...p, [f.key]: e.target.value }))}
                  step={f.step}
                  min={0}
                  placeholder="—"
                  className="w-full bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-200 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Describe your workout… pace, how you felt, any PRs? (optional)"
        rows={2}
        className="w-full bg-slate-800/60 rounded-xl px-3 py-2.5 text-sm border border-slate-700 focus:border-emerald-500 focus:outline-none text-slate-200 placeholder-slate-600 resize-none"
      />

      {!analysis ? (
        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex-1 py-2.5 bg-purple-600/20 text-purple-300 rounded-xl text-sm font-medium hover:bg-purple-600/30 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Brain size={14} />
            {analyzing ? "Analysing…" : "Analyse with AI"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-emerald-600/20 text-emerald-300 rounded-xl text-sm font-medium hover:bg-emerald-600/30 transition-colors disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnalysisCard analysis={analysis} />
          <div className="flex gap-2">
            <button onClick={() => setAnalysis(null)} className="flex-1 py-2.5 bg-slate-700/50 text-slate-400 rounded-xl text-sm">
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600/20 text-emerald-300 rounded-xl text-sm font-medium hover:bg-emerald-600/30 transition-colors disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save Workout"}
            </button>
          </div>
        </div>
      )}

      {saved && <p className="text-xs text-emerald-400 text-center">✓ Workout saved!</p>}
    </div>
  );
}

// ─── Active workout session overlay ──────────────────────────────────────────

function WorkoutSession({ template, onClose, onFinished }) {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [logs, setLogs] = useState(
    (template.exercises || []).map(ex => ({
      name: ex.name,
      sets: [],
      nextReps: (ex.reps?.toString().split("-")[0]) || "10",
      nextWeight: ex.weight_suggestion_kg?.toString() || "",
    }))
  );
  const [restSeconds, setRestSeconds] = useState(null);
  const [saving, setSaving] = useState(false);
  const restRef = useRef(null);

  // Total elapsed timer
  useEffect(() => {
    const id = setInterval(() => setTotalSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function startRest() {
    if (restRef.current) clearInterval(restRef.current);
    setRestSeconds(60);
    restRef.current = setInterval(() => {
      setRestSeconds(s => {
        if (s <= 1) { clearInterval(restRef.current); return null; }
        return s - 1;
      });
    }, 1000);
  }

  function skipRest() {
    if (restRef.current) clearInterval(restRef.current);
    setRestSeconds(null);
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const hasExercises = template.exercises?.length > 0;
  const currentLog = logs[currentExIdx];
  const currentEx = template.exercises?.[currentExIdx];

  function logSet() {
    const reps = parseInt(currentLog.nextReps) || 0;
    const weight = parseFloat(currentLog.nextWeight) || 0;
    setLogs(prev => prev.map((l, i) =>
      i === currentExIdx ? { ...l, sets: [...l.sets, { reps, weight }] } : l
    ));
    startRest();
  }

  function updateNext(field, val) {
    setLogs(prev => prev.map((l, i) => i === currentExIdx ? { ...l, [field]: val } : l));
  }

  async function handleFinish() {
    setSaving(true);
    const totalVolume = logs.reduce((acc, l) => acc + l.sets.reduce((a, s) => a + s.reps * s.weight, 0), 0);
    try {
      await workoutAPI.save({
        workout_type: template.workout_type || "strength",
        duration_minutes: Math.max(Math.round(totalSeconds / 60), 1),
        intensity: totalVolume > 5000 ? "high" : totalVolume > 2000 ? "moderate" : "low",
        description: `${template.name} — template session`,
        details: {
          exercises: logs.map(l => ({ name: l.name, sets: l.sets })),
          template_id: template.id,
          template_name: template.name,
        },
      });
      onFinished?.();
      onClose();
    } catch (e) {
      alert(e.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-800 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Active Session</p>
          <p className="text-base font-bold text-slate-100 truncate">{template.name}</p>
        </div>
        <div className="flex items-center gap-3 ml-3">
          <div className="text-right">
            <p className="text-xl font-mono font-bold text-emerald-400">{formatTime(totalSeconds)}</p>
            <p className="text-[9px] text-slate-600">elapsed</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-600 hover:text-slate-400 rounded-lg">
            <X size={18} />
          </button>
        </div>
      </div>

      {hasExercises ? (
        <>
          {/* Exercise navigation tabs */}
          <div className="flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-none border-b border-slate-800 flex-shrink-0">
            {template.exercises.map((ex, i) => (
              <button
                key={i}
                onClick={() => { setCurrentExIdx(i); skipRest(); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  i === currentExIdx
                    ? "bg-teal-600/30 text-teal-300 ring-1 ring-teal-500/50"
                    : logs[i]?.sets.length > 0
                    ? "bg-emerald-900/20 text-emerald-500"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {logs[i]?.sets.length > 0 ? "✓ " : ""}{ex.name.split(" ").slice(0, 2).join(" ")}
              </button>
            ))}
          </div>

          {/* Current exercise content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-slate-100">{currentEx?.name}</h2>
              {currentEx?.sets && (
                <p className="text-xs text-teal-500 mt-0.5">
                  Target: {currentEx.sets}×{currentEx.reps}
                  {currentEx.weight_suggestion_kg ? ` @ ${currentEx.weight_suggestion_kg}kg` : ""}
                </p>
              )}
            </div>

            {/* Logged sets */}
            {currentLog?.sets.length > 0 && (
              <div className="mb-4 bg-slate-800/40 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[32px_1fr_1fr] gap-2 px-3 py-1.5 border-b border-slate-700/60">
                  <span className="text-[9px] text-slate-600 text-center uppercase">Set</span>
                  <span className="text-[9px] text-slate-600 text-center uppercase">Reps</span>
                  <span className="text-[9px] text-slate-600 text-center uppercase">kg</span>
                </div>
                {currentLog.sets.map((s, i) => (
                  <div key={i} className="grid grid-cols-[32px_1fr_1fr] gap-2 px-3 py-2 border-b border-slate-800/50 last:border-0">
                    <span className="text-xs text-slate-500 text-center font-mono">{i + 1}</span>
                    <span className="text-sm text-emerald-300 text-center font-bold">{s.reps}</span>
                    <span className="text-sm text-slate-200 text-center font-medium">{s.weight || "BW"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Rest timer or set inputs */}
            {restSeconds !== null ? (
              <div className="text-center py-8 bg-blue-950/20 rounded-2xl border border-blue-800/30">
                <p className="text-5xl font-mono font-bold text-blue-400">{restSeconds}s</p>
                <p className="text-xs text-slate-500 mt-2">Rest time</p>
                <button onClick={skipRest}
                  className="mt-4 px-5 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs hover:text-slate-200 hover:bg-slate-700 transition-colors">
                  Skip Rest
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium">
                  Set {(currentLog?.sets.length || 0) + 1}
                  {currentEx?.sets ? ` of ${currentEx.sets}` : ""}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1.5 block">Reps</label>
                    <input
                      type="number"
                      value={currentLog?.nextReps || ""}
                      onChange={e => updateNext("nextReps", e.target.value)}
                      className="w-full bg-slate-800 rounded-2xl px-3 py-4 text-2xl text-center font-bold text-slate-100 border border-slate-700 focus:border-teal-500 focus:outline-none"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1.5 block">Weight (kg)</label>
                    <input
                      type="number"
                      value={currentLog?.nextWeight || ""}
                      onChange={e => updateNext("nextWeight", e.target.value)}
                      placeholder="BW"
                      className="w-full bg-slate-800 rounded-2xl px-3 py-4 text-2xl text-center font-bold text-slate-100 border border-slate-700 focus:border-teal-500 focus:outline-none placeholder-slate-700"
                      min={0}
                      step={2.5}
                    />
                  </div>
                </div>
                <button
                  onClick={logSet}
                  className="w-full py-4 bg-teal-600/20 text-teal-300 rounded-2xl text-sm font-bold hover:bg-teal-600/30 transition-colors flex items-center justify-center gap-2 active:bg-teal-600/40"
                >
                  <CheckCircle size={18} />
                  Log Set {(currentLog?.sets.length || 0) + 1}
                </button>
              </div>
            )}
          </div>

          {/* Bottom navigation */}
          <div className="px-4 py-3 flex gap-2 border-t border-slate-800 flex-shrink-0">
            <button
              onClick={() => { setCurrentExIdx(i => Math.max(0, i - 1)); skipRest(); }}
              disabled={currentExIdx === 0}
              className="px-4 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs disabled:opacity-30 hover:bg-slate-700 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-600/20 text-emerald-300 rounded-xl text-xs font-semibold hover:bg-emerald-600/30 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Finish Workout"}
            </button>
            <button
              onClick={() => { setCurrentExIdx(i => Math.min(template.exercises.length - 1, i + 1)); skipRest(); }}
              disabled={currentExIdx === template.exercises.length - 1}
              className="px-4 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs disabled:opacity-30 hover:bg-slate-700 transition-colors"
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        // No exercises — timer-only mode
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-8">
          <div className="text-center">
            <p className="text-7xl font-mono font-bold text-slate-100">{formatTime(totalSeconds)}</p>
            <p className="text-sm text-slate-500 mt-3">{template.name}</p>
            <span className="text-[10px] bg-teal-900/30 text-teal-400 px-2 py-0.5 rounded-full capitalize mt-2 inline-block">
              {template.workout_type}
            </span>
          </div>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="w-full max-w-xs py-4 bg-emerald-600/20 text-emerald-300 rounded-2xl text-sm font-semibold hover:bg-emerald-600/30 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {saving ? "Saving…" : "Finish Workout"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Templates tab ───────────────────────────────────────────────────────────

const TEMPLATE_TYPES = ["strength", "crossfit", "running", "hiit", "yoga", "cycling", "football", "boxing", "swimming", "pilates", "climbing"];

function TemplatesTab({ onStartWorkout }) {
  const [templates, setTemplates] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newT, setNewT] = useState({ name: "", workout_type: "strength", description: "", estimated_duration: "", exercises: [] });
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showLibPicker, setShowLibPicker] = useState(false);
  const [libFilter, setLibFilter] = useState("All");

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    try {
      const data = await workoutAPI.getTemplates();
      setTemplates(data.templates);
    } catch { /* silently fail */ }
  }

  async function handleDelete(id) {
    try {
      await workoutAPI.deleteTemplate(id);
      setTemplates(p => p.filter(t => t.id !== id));
    } catch { /* ignore */ }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({
      name: t.name,
      workout_type: t.workout_type,
      estimated_duration: t.estimated_duration || "",
      description: t.description || "",
      exercises: (t.exercises || []).map(ex => ({ ...ex })),
    });
    setExpanded(null);
    setShowLibPicker(false);
  }

  function addExFromLibrary(ex) {
    if (editForm.exercises.find(e => e.name === ex.name)) return;
    setEditForm(p => ({
      ...p,
      exercises: [...p.exercises, { name: ex.name, sets: 3, reps: "10", weight_suggestion_kg: "" }],
    }));
  }

  async function saveEdit() {
    setSavingEdit(true);
    try {
      const updated = await workoutAPI.updateTemplate(editingId, {
        name: editForm.name,
        workout_type: editForm.workout_type,
        description: editForm.description || null,
        estimated_duration: editForm.estimated_duration ? parseInt(editForm.estimated_duration) : null,
        exercises: editForm.exercises.filter(ex => ex.name?.trim()).map(ex => ({
          name: ex.name,
          sets: ex.sets ? parseInt(ex.sets) : null,
          reps: ex.reps || null,
          weight_suggestion_kg: ex.weight_suggestion_kg ? parseFloat(ex.weight_suggestion_kg) : null,
        })),
      });
      setTemplates(p => p.map(t => t.id === editingId ? updated : t));
      setEditingId(null);
      setEditForm(null);
    } catch (e) { alert(e.message); }
    setSavingEdit(false);
  }

  function addNewExercise() {
    setNewT(p => ({ ...p, exercises: [...p.exercises, { name: "", sets: "3", reps: "10", weight_suggestion_kg: "" }] }));
  }
  function updateNewExercise(i, field, val) {
    setNewT(p => ({ ...p, exercises: p.exercises.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex) }));
  }
  function removeNewExercise(i) {
    setNewT(p => ({ ...p, exercises: p.exercises.filter((_, idx) => idx !== i) }));
  }

  async function handleCreate() {
    if (!newT.name.trim()) return;
    setSaving(true);
    try {
      const created = await workoutAPI.saveTemplate({
        name: newT.name,
        workout_type: newT.workout_type,
        description: newT.description || null,
        estimated_duration: newT.estimated_duration ? parseInt(newT.estimated_duration) : null,
        exercises: newT.exercises.filter(ex => ex.name.trim()).map(ex => ({
          name: ex.name,
          sets: parseInt(ex.sets) || null,
          reps: ex.reps || null,
          weight_suggestion_kg: ex.weight_suggestion_kg ? parseFloat(ex.weight_suggestion_kg) : null,
        })),
        tags: [],
      });
      setTemplates(p => [created, ...p]);
      setCreating(false);
      setNewT({ name: "", workout_type: "strength", description: "", estimated_duration: "", exercises: [] });
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      {/* Create Template button */}
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="w-full py-2.5 border border-dashed border-slate-700 rounded-xl text-xs text-slate-500 hover:text-teal-400 hover:border-teal-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={13} /> Create Template
        </button>
      )}

      {/* Create form */}
      {creating && (
        <div className="bg-bg-card rounded-xl border border-teal-800/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-teal-400">New Template</p>
            <button onClick={() => setCreating(false)} className="text-slate-600 hover:text-slate-400"><X size={14} /></button>
          </div>
          <input value={newT.name} onChange={e => setNewT(p => ({ ...p, name: e.target.value }))}
            placeholder="Template name"
            className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-teal-500 focus:outline-none" />
          <div className="flex flex-wrap gap-1">
            {TEMPLATE_TYPES.map(type => (
              <button key={type} onClick={() => setNewT(p => ({ ...p, workout_type: type }))}
                className={`px-2.5 py-1 rounded-full text-[10px] capitalize transition-all ${newT.workout_type === type ? "bg-teal-600/30 text-teal-300 ring-1 ring-teal-500/50" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`}>
                {type}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 mb-1 block">Duration (min)</label>
              <input type="number" value={newT.estimated_duration}
                onChange={e => setNewT(p => ({ ...p, estimated_duration: e.target.value }))}
                placeholder="60" min={1}
                className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:outline-none" />
            </div>
          </div>
          <textarea value={newT.description} onChange={e => setNewT(p => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)" rows={2}
            className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:outline-none resize-none" />

          {/* Exercises */}
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Exercises</p>
            {newT.exercises.map((ex, i) => (
              <div key={i} className="bg-slate-800/60 rounded-lg p-2 space-y-1.5">
                <div className="flex gap-1.5">
                  <select value={ex.name} onChange={e => updateNewExercise(i, "name", e.target.value)}
                    className="flex-1 bg-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 ring-teal-500/50">
                    <option value="">Select exercise…</option>
                    {MUSCLE_GROUPS.filter(g => g !== "All").map(muscle => (
                      <optgroup key={muscle} label={muscle}>
                        {EXERCISE_LIBRARY.filter(lib => lib.muscle === muscle).map(lib => (
                          <option key={lib.id} value={lib.name}>{lib.name}</option>
                        ))}
                      </optgroup>
                    ))}
                    {ex.name && !EXERCISE_LIBRARY.find(lib => lib.name === ex.name) && (
                      <option value={ex.name}>{ex.name}</option>
                    )}
                  </select>
                  <button onClick={() => removeNewExercise(i)} className="p-1 text-slate-600 hover:text-red-400"><Trash2 size={11} /></button>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <label className="text-[9px] text-slate-500">Sets</label>
                    <input type="number" value={ex.sets} onChange={e => updateNewExercise(i, "sets", e.target.value)}
                      placeholder="3" min={1} className="w-full bg-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-slate-500">Reps</label>
                    <input value={ex.reps} onChange={e => updateNewExercise(i, "reps", e.target.value)}
                      placeholder="10" className="w-full bg-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-slate-500">kg</label>
                    <input type="number" value={ex.weight_suggestion_kg}
                      onChange={e => updateNewExercise(i, "weight_suggestion_kg", e.target.value)}
                      placeholder="BW" step={2.5} min={0} className="w-full bg-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addNewExercise}
              className="w-full py-1.5 text-[10px] text-slate-500 border border-dashed border-slate-700 rounded-lg hover:border-teal-700 hover:text-teal-400 flex items-center justify-center gap-1">
              <Plus size={10} /> Add exercise
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setCreating(false)} className="flex-1 py-2 bg-slate-800 text-slate-500 rounded-lg text-xs">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !newT.name.trim()}
              className="flex-1 py-2 bg-teal-600/20 text-teal-300 rounded-lg text-xs font-medium hover:bg-teal-600/30 disabled:opacity-40 flex items-center justify-center gap-1">
              <CheckCircle size={12} />
              {saving ? "Saving…" : "Save Template"}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {templates.length === 0 && !creating && (
        <div className="text-center py-8 text-slate-500 text-sm bg-bg-card rounded-xl p-6">
          <BookOpen size={28} className="text-slate-700 mx-auto mb-2" />
          No saved workout templates yet.
          <p className="text-[11px] mt-1">Ask AI for a workout and say <span className="text-teal-400">"save it"</span>, or create one above.</p>
        </div>
      )}

      {/* Template list */}
      {templates.map(t => (
        <div key={t.id} className="bg-bg-card rounded-xl border border-slate-800 overflow-hidden">

          {editingId === t.id && editForm ? (
            /* ── Inline edit form ── */
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-teal-400">Edit Template</span>
                <button onClick={() => setEditingId(null)} className="text-slate-600 hover:text-slate-400"><X size={13} /></button>
              </div>
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-200 border border-slate-700 focus:border-teal-500 focus:outline-none" />
              <div className="flex flex-wrap gap-1">
                {TEMPLATE_TYPES.map(type => (
                  <button key={type} onClick={() => setEditForm(p => ({ ...p, workout_type: type }))}
                    className={`px-2 py-0.5 rounded-full text-[9px] capitalize transition-all ${editForm.workout_type === type ? "bg-teal-600/30 text-teal-300" : "bg-slate-800 text-slate-500"}`}>
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={editForm.estimated_duration}
                  onChange={e => setEditForm(p => ({ ...p, estimated_duration: e.target.value }))}
                  className="w-16 bg-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none" placeholder="60" min={1} />
                <span className="text-[10px] text-slate-500">min</span>
              </div>
              <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Description (optional)"
                className="w-full bg-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 border border-slate-700 focus:outline-none resize-none" />

              {/* Exercise list */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Exercises</p>
                {editForm.exercises.map((ex, i) => (
                  <div key={i} className="bg-slate-800/60 rounded-lg p-2 space-y-1">
                    <div className="flex gap-1.5">
                      <select value={ex.name} onChange={e => setEditForm(p => ({ ...p, exercises: p.exercises.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))}
                        className="flex-1 bg-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:ring-1 ring-teal-500/50">
                        <option value="">Select exercise…</option>
                        {MUSCLE_GROUPS.filter(g => g !== "All").map(muscle => (
                          <optgroup key={muscle} label={muscle}>
                            {EXERCISE_LIBRARY.filter(lib => lib.muscle === muscle).map(lib => (
                              <option key={lib.id} value={lib.name}>{lib.name}</option>
                            ))}
                          </optgroup>
                        ))}
                        {ex.name && !EXERCISE_LIBRARY.find(lib => lib.name === ex.name) && (
                          <option value={ex.name}>{ex.name}</option>
                        )}
                      </select>
                      <button onClick={() => setEditForm(p => ({ ...p, exercises: p.exercises.filter((_, j) => j !== i) }))} className="p-0.5 text-slate-600 hover:text-red-400"><Trash2 size={11} /></button>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500">Sets</label>
                        <input type="number" value={ex.sets ?? ""} onChange={e => setEditForm(p => ({ ...p, exercises: p.exercises.map((x, j) => j === i ? { ...x, sets: e.target.value } : x) }))}
                          placeholder="3" min={1} className="w-full bg-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500">Reps</label>
                        <input value={ex.reps ?? ""} onChange={e => setEditForm(p => ({ ...p, exercises: p.exercises.map((x, j) => j === i ? { ...x, reps: e.target.value } : x) }))}
                          placeholder="10" className="w-full bg-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-500">kg</label>
                        <input type="number" value={ex.weight_suggestion_kg ?? ""} onChange={e => setEditForm(p => ({ ...p, exercises: p.exercises.map((x, j) => j === i ? { ...x, weight_suggestion_kg: e.target.value } : x) }))}
                          placeholder="BW" step={2.5} min={0} className="w-full bg-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add from library / blank */}
                <div className="flex gap-1.5">
                  <button onClick={() => setEditForm(p => ({ ...p, exercises: [...p.exercises, { name: "", sets: 3, reps: "10", weight_suggestion_kg: "" }] }))}
                    className="flex-1 py-1.5 text-[10px] text-slate-500 border border-dashed border-slate-700 rounded-lg hover:border-teal-700 hover:text-teal-400 flex items-center justify-center gap-1">
                    <Plus size={10} /> Blank
                  </button>
                  <button onClick={() => setShowLibPicker(v => !v)}
                    className={`flex-1 py-1.5 text-[10px] border border-dashed rounded-lg flex items-center justify-center gap-1 transition-colors ${showLibPicker ? "border-teal-600 text-teal-400 bg-teal-950/20" : "border-slate-700 text-slate-500 hover:border-teal-700 hover:text-teal-400"}`}>
                    <Dumbbell size={10} /> From Library
                  </button>
                </div>

                {/* Exercise library picker */}
                {showLibPicker && (
                  <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none border-b border-slate-700">
                      {MUSCLE_GROUPS.map(g => (
                        <button key={g} onClick={() => setLibFilter(g)}
                          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] transition-all ${libFilter === g ? "bg-teal-600/30 text-teal-300" : "bg-slate-800 text-slate-500"}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1 p-2 max-h-40 overflow-y-auto">
                      {(libFilter === "All" ? EXERCISE_LIBRARY : EXERCISE_LIBRARY.filter(e => e.muscle === libFilter)).map(ex => {
                        const added = editForm.exercises.some(e => e.name === ex.name);
                        return (
                          <button key={ex.id} onClick={() => addExFromLibrary(ex)} disabled={added}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg text-left text-[10px] transition-all ${added ? "opacity-40 bg-emerald-950/20" : "bg-slate-800/60 hover:bg-slate-700"}`}>
                            <span className="text-sm flex-shrink-0">{ex.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-slate-200 leading-tight truncate">{ex.name}</p>
                              <p className="text-[9px] text-slate-500">{ex.muscle}</p>
                            </div>
                            {added && <CheckCircle size={10} className="text-emerald-400 ml-auto flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-slate-800 text-slate-500 rounded-lg text-xs">Cancel</button>
                <button onClick={saveEdit} disabled={savingEdit || !editForm.name.trim()}
                  className="flex-1 py-2 bg-teal-600/20 text-teal-300 rounded-lg text-xs font-medium hover:bg-teal-600/30 disabled:opacity-40 flex items-center justify-center gap-1">
                  <CheckCircle size={12} />
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            /* ── Normal card view ── */
            <>
              <div className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(e => e === t.id ? null : t.id)}>
                  <p className="text-sm font-medium text-slate-200 truncate">{t.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] bg-teal-900/30 text-teal-400 px-1.5 py-0.5 rounded-full capitalize">{t.workout_type}</span>
                    {t.estimated_duration && <span className="text-[10px] text-slate-500">{t.estimated_duration}min</span>}
                    {t.exercises?.length > 0 && <span className="text-[10px] text-slate-500">{t.exercises.length} exercises</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onStartWorkout(t)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600/20 text-teal-300 rounded-lg text-[11px] hover:bg-teal-600/30 transition-colors">
                    <Play size={10} fill="currentColor" /> Start
                  </button>
                  <button onClick={() => startEdit(t)} className="p-1.5 text-slate-600 hover:text-teal-400 transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-700 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                  <button onClick={() => setExpanded(e => e === t.id ? null : t.id)} className="p-1">
                    {expanded === t.id ? <ChevronUp size={12} className="text-slate-600" /> : <ChevronDown size={12} className="text-slate-600" />}
                  </button>
                </div>
              </div>

              {expanded === t.id && (
                <div className="px-3 pb-3 border-t border-slate-800 pt-2 space-y-2">
                  {t.description && <p className="text-xs text-slate-400">{t.description}</p>}
                  {t.tags?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {t.tags.map(tag => (
                        <span key={tag} className="text-[9px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                  {t.exercises?.length > 0 && (
                    <div className="space-y-1">
                      {t.exercises.map((ex, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-2.5 py-1.5">
                          <span className="text-xs text-slate-200 flex-1">{ex.name}</span>
                          <span className="text-[11px] text-slate-500">
                            {ex.sets ? `${ex.sets}×` : ""}{ex.reps}
                            {ex.weight_suggestion_kg ? ` @ ${ex.weight_suggestion_kg}kg` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const [tab, setTab] = useState("cardio"); // "cardio" | "strength" | "templates"
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [h, s] = await Promise.all([workoutAPI.getAll(14), workoutAPI.getStats()]);
      setHistory(h.workouts);
      setStats(s);
    } catch { /* silently fail */ }
  }

  async function handleDelete(id) {
    try {
      await workoutAPI.delete(id);
      setHistory(h => h.filter(w => w.id !== id));
    } catch { /* ignore */ }
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
        Workout
      </h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-bg-card rounded-xl p-3 text-center">
            <Activity size={14} className="text-emerald-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-emerald-400">{stats.this_week.count}</div>
            <div className="text-[10px] text-slate-500">sessions</div>
          </div>
          <div className="bg-bg-card rounded-xl p-3 text-center">
            <Clock size={14} className="text-blue-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-400">{stats.this_week.total_minutes}</div>
            <div className="text-[10px] text-slate-500">min this week</div>
          </div>
          <div className="bg-bg-card rounded-xl p-3 text-center">
            <Flame size={14} className="text-amber-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-amber-400">{stats.this_week.total_calories || "—"}</div>
            <div className="text-[10px] text-slate-500">kcal burned</div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex bg-slate-800/60 rounded-xl p-1 mb-4">
        <button onClick={() => setTab("cardio")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === "cardio" ? "bg-emerald-600/20 text-emerald-300" : "text-slate-500 hover:text-slate-300"}`}>
          Cardio
        </button>
        <button onClick={() => setTab("strength")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === "strength" ? "bg-purple-600/20 text-purple-300" : "text-slate-500 hover:text-slate-300"}`}>
          Strength
        </button>
        <button onClick={() => setTab("templates")}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${tab === "templates" ? "bg-teal-600/20 text-teal-300" : "text-slate-500 hover:text-slate-300"}`}>
          <BookOpen size={11} /> Templates
        </button>
      </div>

      {tab === "cardio" && <CardioTab onSaved={loadData} />}
      {tab === "strength" && <StrengthTab onSaved={loadData} />}
      {tab === "templates" && <TemplatesTab onStartWorkout={t => setActiveSession(t)} />}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Recent (14 days)</h3>
          <div className="space-y-2">
            {history.map(w => (
              <WorkoutHistoryItem key={w.id} w={w} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Active workout session overlay */}
      {activeSession && (
        <WorkoutSession
          template={activeSession}
          onClose={() => setActiveSession(null)}
          onFinished={loadData}
        />
      )}
    </div>
  );
}
