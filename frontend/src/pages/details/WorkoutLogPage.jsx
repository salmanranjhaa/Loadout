import { useState, useEffect, useRef } from "react";
import { T } from "../../design/tokens";
import { Icon } from "../../design/icons";
import { Card, DetailHeader, PageScroll, SectionHead } from "../../design/components";
import { workoutAPI } from "../../utils/api";

// ── Comprehensive exercise library ──────────────────────────────────────────
const EXERCISE_LIBRARY = [
  // Chest
  { name: "Bench Press", muscle: "Chest", equipment: "Barbell" },
  { name: "Incline Bench Press", muscle: "Chest", equipment: "Barbell" },
  { name: "Decline Bench Press", muscle: "Chest", equipment: "Barbell" },
  { name: "Incline DB Press", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Flat DB Press", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Decline DB Press", muscle: "Chest", equipment: "Dumbbell" },
  { name: "Cable Fly (High to Low)", muscle: "Chest", equipment: "Cable" },
  { name: "Cable Fly (Low to High)", muscle: "Chest", equipment: "Cable" },
  { name: "Pec Deck", muscle: "Chest", equipment: "Machine" },
  { name: "Chest Press Machine", muscle: "Chest", equipment: "Machine" },
  { name: "Weighted Dips", muscle: "Chest", equipment: "Bodyweight" },
  { name: "Push-ups", muscle: "Chest", equipment: "Bodyweight" },
  { name: "Dumbbell Pullover", muscle: "Chest", equipment: "Dumbbell" },
  // Back
  { name: "Deadlift", muscle: "Back", equipment: "Barbell" },
  { name: "Romanian Deadlift", muscle: "Back", equipment: "Barbell" },
  { name: "Sumo Deadlift", muscle: "Back", equipment: "Barbell" },
  { name: "Rack Pull", muscle: "Back", equipment: "Barbell" },
  { name: "Pull-ups", muscle: "Back", equipment: "Bodyweight" },
  { name: "Weighted Pull-ups", muscle: "Back", equipment: "Bodyweight" },
  { name: "Chin-ups", muscle: "Back", equipment: "Bodyweight" },
  { name: "Bent-over Barbell Row", muscle: "Back", equipment: "Barbell" },
  { name: "Pendlay Row", muscle: "Back", equipment: "Barbell" },
  { name: "One-arm DB Row", muscle: "Back", equipment: "Dumbbell" },
  { name: "Lat Pulldown", muscle: "Back", equipment: "Cable" },
  { name: "Seated Cable Row", muscle: "Back", equipment: "Cable" },
  { name: "Straight-arm Pulldown", muscle: "Back", equipment: "Cable" },
  { name: "T-Bar Row", muscle: "Back", equipment: "Barbell" },
  { name: "Face Pull", muscle: "Back", equipment: "Cable" },
  { name: "Machine Row", muscle: "Back", equipment: "Machine" },
  { name: "Meadows Row", muscle: "Back", equipment: "Barbell" },
  // Shoulders
  { name: "Overhead Press (Barbell)", muscle: "Shoulders", equipment: "Barbell" },
  { name: "DB Shoulder Press", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Seated DB Press", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Arnold Press", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Lateral Raise", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Cable Lateral Raise", muscle: "Shoulders", equipment: "Cable" },
  { name: "Front Raise", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Rear Delt Fly", muscle: "Shoulders", equipment: "Dumbbell" },
  { name: "Rear Delt Cable Fly", muscle: "Shoulders", equipment: "Cable" },
  { name: "Upright Row", muscle: "Shoulders", equipment: "Barbell" },
  { name: "Machine Shoulder Press", muscle: "Shoulders", equipment: "Machine" },
  { name: "Cable Face Pull", muscle: "Shoulders", equipment: "Cable" },
  // Biceps
  { name: "Barbell Curl", muscle: "Biceps", equipment: "Barbell" },
  { name: "EZ-Bar Curl", muscle: "Biceps", equipment: "Barbell" },
  { name: "DB Curl", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Hammer Curl", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Incline DB Curl", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Concentration Curl", muscle: "Biceps", equipment: "Dumbbell" },
  { name: "Spider Curl", muscle: "Biceps", equipment: "Barbell" },
  { name: "Cable Curl", muscle: "Biceps", equipment: "Cable" },
  { name: "Preacher Curl", muscle: "Biceps", equipment: "Machine" },
  { name: "Reverse Curl", muscle: "Biceps", equipment: "Barbell" },
  // Triceps
  { name: "Close Grip Bench Press", muscle: "Triceps", equipment: "Barbell" },
  { name: "Skull Crusher (EZ-Bar)", muscle: "Triceps", equipment: "Barbell" },
  { name: "Skull Crusher (DB)", muscle: "Triceps", equipment: "Dumbbell" },
  { name: "Tricep Pushdown (Rope)", muscle: "Triceps", equipment: "Cable" },
  { name: "Tricep Pushdown (Bar)", muscle: "Triceps", equipment: "Cable" },
  { name: "Overhead Tricep Extension", muscle: "Triceps", equipment: "Dumbbell" },
  { name: "Cable Overhead Extension", muscle: "Triceps", equipment: "Cable" },
  { name: "Dips (Tricep)", muscle: "Triceps", equipment: "Bodyweight" },
  { name: "Diamond Push-ups", muscle: "Triceps", equipment: "Bodyweight" },
  { name: "Kickbacks", muscle: "Triceps", equipment: "Dumbbell" },
  // Legs
  { name: "Back Squat", muscle: "Legs", equipment: "Barbell" },
  { name: "Front Squat", muscle: "Legs", equipment: "Barbell" },
  { name: "Goblet Squat", muscle: "Legs", equipment: "Dumbbell" },
  { name: "Bulgarian Split Squat", muscle: "Legs", equipment: "Dumbbell" },
  { name: "Leg Press", muscle: "Legs", equipment: "Machine" },
  { name: "Hack Squat", muscle: "Legs", equipment: "Machine" },
  { name: "Leg Extension", muscle: "Legs", equipment: "Machine" },
  { name: "Seated Leg Curl", muscle: "Legs", equipment: "Machine" },
  { name: "Lying Leg Curl", muscle: "Legs", equipment: "Machine" },
  { name: "Hip Thrust", muscle: "Legs", equipment: "Barbell" },
  { name: "Romanian Deadlift (Legs)", muscle: "Legs", equipment: "Barbell" },
  { name: "Walking Lunges", muscle: "Legs", equipment: "Dumbbell" },
  { name: "Reverse Lunges", muscle: "Legs", equipment: "Dumbbell" },
  { name: "Calf Raise (Standing)", muscle: "Legs", equipment: "Machine" },
  { name: "Calf Raise (Seated)", muscle: "Legs", equipment: "Machine" },
  { name: "Step-ups", muscle: "Legs", equipment: "Dumbbell" },
  { name: "Good Mornings", muscle: "Legs", equipment: "Barbell" },
  { name: "Glute Kickback", muscle: "Legs", equipment: "Cable" },
  // Core
  { name: "Plank", muscle: "Core", equipment: "Bodyweight" },
  { name: "Side Plank", muscle: "Core", equipment: "Bodyweight" },
  { name: "Hanging Leg Raise", muscle: "Core", equipment: "Bodyweight" },
  { name: "Ab Wheel Rollout", muscle: "Core", equipment: "Equipment" },
  { name: "Cable Crunch", muscle: "Core", equipment: "Cable" },
  { name: "Russian Twist", muscle: "Core", equipment: "Bodyweight" },
  { name: "Dead Bug", muscle: "Core", equipment: "Bodyweight" },
  { name: "Hollow Body Hold", muscle: "Core", equipment: "Bodyweight" },
  { name: "V-ups", muscle: "Core", equipment: "Bodyweight" },
  { name: "Decline Crunch", muscle: "Core", equipment: "Equipment" },
  { name: "Pallof Press", muscle: "Core", equipment: "Cable" },
  // Cardio / Hyrox
  { name: "Ski Erg", muscle: "Cardio", equipment: "Machine" },
  { name: "Sled Push", muscle: "Cardio", equipment: "Equipment" },
  { name: "Sled Pull", muscle: "Cardio", equipment: "Equipment" },
  { name: "Burpee Broad Jump", muscle: "Cardio", equipment: "Bodyweight" },
  { name: "Wall Ball", muscle: "Cardio", equipment: "Equipment" },
  { name: "Sandbag Lunges", muscle: "Cardio", equipment: "Equipment" },
  { name: "Rowing Machine", muscle: "Cardio", equipment: "Machine" },
  { name: "Assault Bike", muscle: "Cardio", equipment: "Machine" },
  { name: "Box Jump", muscle: "Cardio", equipment: "Equipment" },
  { name: "Kettlebell Swing", muscle: "Cardio", equipment: "Kettlebell" },
  { name: "Battle Rope", muscle: "Cardio", equipment: "Equipment" },
  { name: "Farmer's Carry", muscle: "Cardio", equipment: "Dumbbell" },
  { name: "Double Unders", muscle: "Cardio", equipment: "Equipment" },
  { name: "Tuck Jump", muscle: "Cardio", equipment: "Bodyweight" },
];

const MUSCLE_GROUPS = ["All", "Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Core", "Cardio"];

const MUSCLE_COLORS = {
  Chest: T.teal, Back: T.violet, Shoulders: T.amber, Biceps: "#5C8FFC",
  Triceps: "#FF5C9E", Legs: T.teal, Core: T.amber, Cardio: T.negative,
};

// ── Timer formatting ─────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, "0"); }
function formatElapsed(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

// ── Exercise Picker Sheet ────────────────────────────────────────────────────
function ExercisePicker({ onAdd, onClose }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = EXERCISE_LIBRARY.filter(e =>
    (filter === "All" || e.muscle === filter) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 30,
        background: "rgba(10,10,15,0.88)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", background: T.surface,
        borderRadius: "20px 20px 0 0",
        border: `1px solid ${T.border}`, borderBottom: "none",
        maxHeight: "82vh", display: "flex", flexDirection: "column",
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: T.border, margin: "12px auto 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "12px 16px 0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, flex: 1 }}>Add Exercise</div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 9999,
              background: T.elevated, border: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: T.textMuted, flexShrink: 0,
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 16px 0", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <Icon name="search" size={14} color={T.textDim} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises…"
              style={{
                width: "100%", padding: "8px 10px 8px 32px",
                background: T.elevated, border: `1px solid ${T.border}`,
                borderRadius: 10, fontSize: 13, color: T.text,
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Muscle group chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 16px", scrollbarWidth: "none", flexShrink: 0 }}>
          {MUSCLE_GROUPS.map(mg => (
            <button
              key={mg}
              onClick={() => setFilter(mg)}
              style={{
                flexShrink: 0, padding: "5px 12px", borderRadius: 9999,
                background: filter === mg ? T.teal : T.elevated,
                border: `1px solid ${filter === mg ? T.teal : T.border}`,
                color: filter === mg ? "#0A0A0F" : T.text,
                fontSize: 11, fontWeight: filter === mg ? 700 : 500,
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {mg}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 16px 24px" }}>
          {filtered.map((ex, i) => {
            const accent = MUSCLE_COLORS[ex.muscle] || T.teal;
            return (
              <button
                key={i}
                onClick={() => onAdd(ex)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", marginBottom: 5,
                  background: T.elevated, border: `1px solid ${T.border}`,
                  borderRadius: 12, cursor: "pointer", textAlign: "left",
                  fontFamily: "inherit", borderLeft: `3px solid ${accent}44`,
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${accent}18`, border: `1px solid ${accent}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon name="dumbbell" size={16} color={accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{ex.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>{ex.muscle} · {ex.equipment}</div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: 9999,
                  background: `${T.teal}20`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="plus" size={13} color={T.teal} />
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: T.textDim, fontSize: 13 }}>
              No exercises found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Set Edit Sheet ───────────────────────────────────────────────────────────
function SetEditSheet({ exerciseName, setData, onSave, onClose, onDelete }) {
  const [weight, setWeight] = useState(String(setData?.weight ?? "0"));
  const [reps, setReps] = useState(setData?.reps ?? 10);

  const adjBtnStyle = {
    width: 42, height: 42, borderRadius: 10,
    background: T.elevated2, border: `1px solid ${T.border}`,
    color: T.text, fontSize: 20, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit", flexShrink: 0,
  };

  function stepWeight(delta) {
    const current = parseFloat(weight) || 0;
    const next = Math.max(0, current + delta);
    setWeight(next % 1 === 0 ? String(next) : next.toFixed(1));
  }

  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 40,
        background: "rgba(10,10,15,0.88)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", background: T.surface,
        borderRadius: "20px 20px 0 0",
        border: `1px solid ${T.border}`, borderBottom: "none",
        padding: "16px 20px 40px",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 9999, background: T.border, margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{exerciseName}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Set {setData?.num}</div>
          </div>
          <button
            onClick={onDelete}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.negative, padding: 4 }}
          >
            <Icon name="trash" size={16} color={T.negative} />
          </button>
        </div>

        {/* Weight */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>
            Weight (kg)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={adjBtnStyle} onClick={() => stepWeight(-2.5)}>−</button>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              style={{
                flex: 1, textAlign: "center", fontSize: 32, fontWeight: 800,
                color: T.text, background: T.elevated, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: "10px 0", fontFamily: T.fontMono, outline: "none",
              }}
            />
            <button style={adjBtnStyle} onClick={() => stepWeight(2.5)}>+</button>
          </div>
        </div>

        {/* Reps */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>
            Reps
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={adjBtnStyle} onClick={() => setReps(r => Math.max(1, r - 1))}>−</button>
            <div style={{
              flex: 1, textAlign: "center", fontSize: 32, fontWeight: 800,
              color: T.text, fontFamily: T.fontMono,
              background: T.elevated, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "10px 0",
            }}>
              {reps}
            </div>
            <button style={adjBtnStyle} onClick={() => setReps(r => r + 1)}>+</button>
          </div>
        </div>

        <button
          onClick={() => onSave(weight, reps)}
          style={{
            width: "100%", padding: "14px 0",
            background: T.teal, border: "none", borderRadius: 13,
            color: "#0A0A0F", fontSize: 15, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Save Set
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function WorkoutLogPage({ workout, onBack, mode = "live" }) {
  const isLive = mode === "live";
  const name = workout?.name || workout?.type || workout?.workout_type || "Workout";
  const date = workout?.date || new Date().toLocaleDateString();

  // Timer
  const [elapsed, setElapsed] = useState(() => {
    if (!isLive) return ((workout?.duration_minutes || workout?.duration || 0) * 60);
    return 0;
  });
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isLive || paused) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [isLive, paused]);

  // Exercises state
  const [exercises, setExercises] = useState(() => {
    // History mode: load from saved details
    if (!isLive && workout?.details?.exercises?.length) {
      return workout.details.exercises.map(ex => ({
        name: ex.name,
        muscle: ex.muscle || "",
        sets: (ex.sets || []).map((s, i) => ({ num: i + 1, weight: s.weight || "0", reps: s.reps || 0, done: s.done ?? true, pr: s.pr || false })),
      }));
    }
    // Live mode from template with exercises
    if (isLive && workout?.exercises?.length) {
      return workout.exercises.map(ex => ({
        name: typeof ex === "string" ? ex : (ex.name || ex),
        muscle: ex.muscle || "",
        sets: [{ num: 1, weight: "20", reps: 10, done: false, pr: false }],
      }));
    }
    return [];
  });

  const [showPicker, setShowPicker] = useState(false);
  const [editingSet, setEditingSet] = useState(null); // {exIdx, si}
  const [saving, setSaving] = useState(false);

  // Computed stats
  const totalVolume = exercises.reduce((tot, ex) =>
    tot + ex.sets.reduce((s, set) => s + (parseFloat(set.weight || 0) * (parseInt(set.reps) || 0)), 0), 0
  );
  const doneSets = exercises.reduce((tot, ex) => tot + ex.sets.filter(s => s.done).length, 0);

  function toggleSet(exIdx, si) {
    if (!isLive) return;
    setExercises(prev => prev.map((ex, ei) => ei !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, idx) => idx !== si ? s : { ...s, done: !s.done }),
    }));
  }

  function addSet(exIdx) {
    setExercises(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return {
        ...ex,
        sets: [...ex.sets, { num: ex.sets.length + 1, weight: last?.weight || "20", reps: last?.reps || 10, done: false, pr: false }],
      };
    }));
  }

  function saveSet(exIdx, si, weight, reps) {
    setExercises(prev => prev.map((ex, ei) => ei !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, idx) => idx !== si ? s : { ...s, weight, reps }),
    }));
    setEditingSet(null);
  }

  function deleteSet(exIdx, si) {
    setExercises(prev => prev.map((ex, ei) => {
      if (ei !== exIdx) return ex;
      const newSets = ex.sets.filter((_, i) => i !== si).map((s, i) => ({ ...s, num: i + 1 }));
      return { ...ex, sets: newSets };
    }));
    setEditingSet(null);
  }

  function addExercise(ex) {
    setExercises(prev => [...prev, {
      name: ex.name, muscle: ex.muscle,
      sets: [{ num: 1, weight: "20", reps: 10, done: false, pr: false }],
    }]);
    setShowPicker(false);
  }

  function removeExercise(exIdx) {
    setExercises(prev => prev.filter((_, i) => i !== exIdx));
  }

  async function finishSession() {
    setSaving(true);
    try {
      const durationMins = Math.max(1, Math.round(elapsed / 60));
      const details = {
        exercises: exercises.map(ex => ({
          name: ex.name, muscle: ex.muscle,
          sets: ex.sets.map(s => ({ num: s.num, weight: s.weight, reps: s.reps, done: s.done, pr: s.pr })),
        })),
      };
      const caloriesEst = Math.round(durationMins * 7);
      const workoutType = workout?.workout_type || workout?.type || "strength";

      await workoutAPI.save({
        workout_type: workoutType,
        duration_minutes: durationMins,
        intensity: "moderate",
        description: exercises.length > 0
          ? `Strength session: ${exercises.map(e => e.name).join(", ")}`
          : "Strength session",
        details,
        calories_burned_est: caloriesEst,
      });

      onBack?.();
    } catch (e) {
      alert("Failed to save: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  const subtitle = isLive ? "live" : date;
  const editSet = editingSet ? exercises[editingSet.exIdx]?.sets[editingSet.si] : null;
  const editExName = editingSet ? exercises[editingSet.exIdx]?.name : "";

  return (
    <div style={{
      position: "absolute", inset: 0, background: T.bg,
      display: "flex", flexDirection: "column", zIndex: 10,
      animationName: "lo-slide-in", animationDuration: "0.25s", animationFillMode: "forwards",
    }}>
      {/* Header */}
      <DetailHeader
        onBack={onBack}
        title={`${name} · ${subtitle}`}
        trailing={
          isLive ? (
            <button
              onClick={finishSession}
              disabled={saving}
              style={{
                height: 30, padding: "0 12px",
                background: `${T.negative}22`, border: `1px solid ${T.negative}66`,
                borderRadius: 8, color: T.negative, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5,
                opacity: saving ? 0.5 : 1,
              }}
            >
              END
            </button>
          ) : (
            <div style={{ width: 34 }} />
          )
        }
      />

      <PageScroll padBottom={isLive ? 100 : 24}>
        <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Timer/stats hero */}
          <div style={{
            borderRadius: T.rCard,
            background: isLive
              ? `linear-gradient(135deg, ${T.tealDim}88, ${T.violetDim}cc)`
              : T.surface,
            border: isLive ? `1px solid ${T.teal}30` : `1px solid ${T.border}`,
            padding: 20, display: "flex", alignItems: "center", gap: 20,
          }}>
            <div style={{ flex: 1 }}>
              {isLive && (
                <div style={{ fontSize: 10, color: `${T.teal}cc`, fontFamily: T.fontMono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  ● Live
                </div>
              )}
              <div style={{ fontSize: 44, fontWeight: 800, fontFamily: T.fontMono, color: T.text, letterSpacing: -2, lineHeight: 1 }}>
                {formatElapsed(elapsed)}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, fontFamily: T.fontMono }}>
                {isLive ? "elapsed" : "duration"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                background: "rgba(10,10,15,0.45)", backdropFilter: "blur(8px)",
                borderRadius: 10, padding: "8px 12px", textAlign: "center",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.fontMono }}>
                  {Math.round(totalVolume).toLocaleString()}
                </div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>vol kg</div>
              </div>
              <div style={{
                background: "rgba(10,10,15,0.45)", backdropFilter: "blur(8px)",
                borderRadius: 10, padding: "8px 12px", textAlign: "center",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.fontMono }}>{doneSets}</div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>sets done</div>
              </div>
            </div>
          </div>

          {/* Empty state for live with no exercises */}
          {isLive && exercises.length === 0 && (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              border: `1.5px dashed ${T.border}`, borderRadius: T.rCard,
            }}>
              <Icon name="dumbbell" size={32} color={T.textDim} />
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 12 }}>Start adding exercises</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Tap the button below to build your session</div>
            </div>
          )}

          {/* Exercise groups */}
          {exercises.map((ex, exIdx) => (
            <div key={exIdx}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <SectionHead
                    title={ex.name.toUpperCase()}
                    trailing={
                      isLive ? (
                        <button
                          onClick={() => removeExercise(exIdx)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: T.textDim, padding: 4 }}
                        >
                          <Icon name="trash" size={13} color={T.textDim} />
                        </button>
                      ) : null
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {ex.sets.map((s, si) => (
                  <div key={si} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {/* Set card */}
                    <div
                      onClick={() => isLive && toggleSet(exIdx, si)}
                      style={{
                        flexShrink: 0, width: 86,
                        background: s.done ? `${T.teal}18` : T.surface,
                        border: `1px solid ${s.done ? T.teal + "60" : T.border}`,
                        borderRadius: 13, padding: "10px",
                        cursor: isLive ? "pointer" : "default",
                        position: "relative",
                        userSelect: "none",
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        position: "absolute", top: 8, left: 8,
                        width: 16, height: 16, borderRadius: 5,
                        background: s.done ? T.teal : T.elevated2,
                        border: s.done ? "none" : `1px solid ${T.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {s.done && <Icon name="check" size={10} color="#0A0A0F" strokeWidth={2.5} />}
                      </div>

                      {/* PR badge */}
                      {s.pr && (
                        <div style={{ position: "absolute", top: 6, right: 6, fontSize: 9, color: T.amber, fontWeight: 700 }}>★</div>
                      )}

                      <div style={{ marginTop: 18, textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: T.textMuted, fontFamily: T.fontMono, letterSpacing: 0.5 }}>
                          SET {s.num}
                        </div>
                        {/* Tappable weight */}
                        <div
                          onClick={e => { if (isLive) { e.stopPropagation(); setEditingSet({ exIdx, si }); } }}
                          style={{
                            fontSize: 18, fontWeight: 800, color: T.text,
                            fontFamily: T.fontMono, lineHeight: 1.1, marginTop: 4,
                            cursor: isLive ? "pointer" : "default",
                            borderBottom: isLive ? `1px dashed ${T.border}` : "none",
                            paddingBottom: 1,
                          }}
                        >
                          {s.weight}
                        </div>
                        <div style={{ fontSize: 9, color: T.textMuted, fontFamily: T.fontMono, marginTop: 1 }}>kg</div>
                        {/* Tappable reps */}
                        <div
                          onClick={e => { if (isLive) { e.stopPropagation(); setEditingSet({ exIdx, si }); } }}
                          style={{
                            fontSize: 12, color: T.textMuted, fontFamily: T.fontMono, marginTop: 3,
                            cursor: isLive ? "pointer" : "default",
                          }}
                        >
                          × {s.reps}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add set dashed card (live only) */}
                {isLive && (
                  <div
                    onClick={() => addSet(exIdx)}
                    style={{
                      flexShrink: 0, width: 86, minHeight: 116,
                      background: "transparent", border: `1.5px dashed ${T.border}`,
                      borderRadius: 13, display: "flex", alignItems: "center",
                      justifyContent: "center", cursor: "pointer", color: T.textDim,
                    }}
                  >
                    <Icon name="plus" size={18} color={T.textDim} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add exercise dashed button (live only) */}
          {isLive && (
            <button
              onClick={() => setShowPicker(true)}
              style={{
                width: "100%", padding: "14px",
                background: "transparent", border: `1.5px dashed ${T.border}`,
                borderRadius: T.rCard, color: T.textMuted, fontSize: 13, fontWeight: 500,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6, fontFamily: "inherit",
              }}
            >
              <Icon name="plus" size={16} color={T.textMuted} />
              Add exercise
            </button>
          )}

          {/* AI analysis card (history only) */}
          {!isLive && workout?.ai_analysis && (
            <div>
              <SectionHead title="AI Analysis" />
              <Card style={{
                background: `linear-gradient(135deg, ${T.violetDim}55, ${T.elevated})`,
                border: `1px solid ${T.violet}40`,
                padding: 16, display: "flex", gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9999, flexShrink: 0,
                  background: `linear-gradient(135deg, ${T.violet}, ${T.violetDim})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name="sparkle" size={18} color={T.text} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Session insight</div>
                  <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>
                    {typeof workout.ai_analysis === "string"
                      ? workout.ai_analysis
                      : workout.ai_analysis?.summary || workout.ai_analysis?.text || JSON.stringify(workout.ai_analysis)}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* History: session notes */}
          {!isLive && workout?.notes && (
            <div>
              <SectionHead title="Notes" />
              <Card style={{ padding: 14 }}>
                <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>{workout.notes}</div>
              </Card>
            </div>
          )}
        </div>
      </PageScroll>

      {/* Sticky bottom bar (live only) */}
      {isLive && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "12px 16px 28px",
          background: `linear-gradient(to top, ${T.bg} 70%, transparent)`,
          display: "flex", gap: 10, alignItems: "center",
        }}>
          <button
            onClick={() => setPaused(p => !p)}
            style={{
              flex: 1, height: 46, borderRadius: 13,
              background: T.elevated, border: `1px solid ${T.border}`,
              color: T.text, fontSize: 14, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, fontFamily: "inherit",
            }}
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={finishSession}
            disabled={saving}
            style={{
              flex: 2, height: 46, borderRadius: 13,
              background: saving ? T.elevated : T.teal, border: "none",
              color: saving ? T.textMuted : "#0A0A0F", fontSize: 15, fontWeight: 700,
              cursor: saving ? "default" : "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, fontFamily: "inherit",
            }}
          >
            <Icon name="check" size={18} color={saving ? T.textMuted : "#0A0A0F"} strokeWidth={2.4} />
            {saving ? "Saving…" : "Finish Session"}
          </button>
        </div>
      )}

      {/* Exercise picker sheet */}
      {showPicker && (
        <ExercisePicker onAdd={addExercise} onClose={() => setShowPicker(false)} />
      )}

      {/* Set edit sheet */}
      {editingSet && editSet && (
        <SetEditSheet
          exerciseName={editExName}
          setData={editSet}
          onSave={(w, r) => saveSet(editingSet.exIdx, editingSet.si, w, r)}
          onClose={() => setEditingSet(null)}
          onDelete={() => deleteSet(editingSet.exIdx, editingSet.si)}
        />
      )}
    </div>
  );
}
