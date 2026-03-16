import { useState, useEffect } from "react";
import { Scale, Target, Activity, Flame, Utensils, Wallet, TrendingDown, TrendingUp, ArrowDown } from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Filler,
} from "chart.js";
import { analyticsAPI, workoutAPI, budgetAPI } from "../utils/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

const TABS = ["Overview", "Weight", "Fitness", "Nutrition"];

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
  scales: {
    x: { grid: { color: "rgba(148,163,184,0.08)" }, ticks: { color: "#64748b", font: { size: 9 } } },
    y: { grid: { color: "rgba(148,163,184,0.08)" }, ticks: { color: "#64748b", font: { size: 9 } } },
  },
};


function StatCard({ icon: Icon, value, label, color, sub }) {
  return (
    <div className="bg-bg-card rounded-xl p-3 text-center">
      {Icon && <Icon size={14} className={`${color} mx-auto mb-1`} />}
      <div className={`text-xl font-bold ${color}`}>{value ?? "—"}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
      {sub && <div className="text-[9px] text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState("Overview");
  const [dashboard, setDashboard] = useState(null);
  const [weights, setWeights] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [weightInput, setWeightInput] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);
  const [budgetSummary, setBudgetSummary] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [dash, wData, bSum, wkData] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getWeights(30),
        budgetAPI.getSummary(),
        workoutAPI.getAll(30),
      ]);
      setDashboard(dash);
      setWeights(wData.weights || []);
      setBudgetSummary(bSum);
      setWorkouts(wkData.workouts || []);
    } catch {/* silently fail */}
  }

  async function handleLogWeight() {
    if (!weightInput) return;
    setLoggingWeight(true);
    try {
      await analyticsAPI.logWeight({ weight_kg: parseFloat(weightInput) });
      setWeightInput("");
      setWeightSaved(true);
      setTimeout(() => setWeightSaved(false), 2000);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
    setLoggingWeight(false);
  }

  const current = dashboard?.weight.current;
  const weekChange = dashboard?.weight.week_change;
  const toTarget = current ? (current - 81).toFixed(1) : null;

  const weightSlice = weights.slice(-21);
  const weightLineData = {
    labels: weightSlice.map(w => w.date.slice(5)),
    datasets: [{
      data: weightSlice.map(w => w.weight_kg),
      borderColor: "#3b82f6",
      backgroundColor: "rgba(59,130,246,0.08)",
      fill: true, tension: 0.4,
      pointRadius: 3, pointBackgroundColor: "#3b82f6",
    }],
  };

  // Workouts per day (last 14 days)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const workoutsByDay = last14.map(day => ({
    label: day.slice(5),
    value: workouts.filter(w => w.date === day).length,
  }));
  const workoutBarData = {
    labels: workoutsByDay.map(d => d.label),
    datasets: [{
      data: workoutsByDay.map(d => d.value),
      backgroundColor: "rgba(52,211,153,0.5)",
      borderColor: "#34d399",
      borderWidth: 1, borderRadius: 3,
    }],
  };

  const calorieTarget = 2100;
  const proteinTarget = 190;
  const avgCal = dashboard?.nutrition_this_week.avg_calories;
  const avgPro = dashboard?.nutrition_this_week.avg_protein;

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
        Analytics
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t ? "bg-slate-700 text-white" : "text-slate-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "Overview" && (
        <div className="space-y-4">

          {/* Weight row */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={Scale} value={current?.toFixed(1)} label="Current kg" color="text-blue-400" />
            <div className="bg-bg-card rounded-xl p-3 text-center">
              {weekChange != null
                ? weekChange <= 0
                  ? <TrendingDown size={14} className="text-emerald-400 mx-auto mb-1" />
                  : <TrendingUp size={14} className="text-red-400 mx-auto mb-1" />
                : <ArrowDown size={14} className="text-slate-600 mx-auto mb-1" />}
              <div className={`text-xl font-bold ${weekChange != null ? (weekChange <= 0 ? "text-emerald-400" : "text-red-400") : "text-slate-600"}`}>
                {weekChange != null ? (weekChange > 0 ? `+${weekChange}` : weekChange) : "—"}
              </div>
              <div className="text-[10px] text-slate-500">kg this week</div>
            </div>
            <StatCard icon={Target} value={toTarget} label="kg to 81" color="text-amber-400" />
          </div>

          {/* Fitness row */}
          <div className="bg-bg-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400">Fitness This Week</h3>
              <span className="text-[10px] text-slate-600">target: 8–9 sessions</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">{dashboard?.fitness_this_week.workouts ?? "—"}</div>
                <div className="text-[10px] text-slate-500">sessions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{dashboard?.fitness_this_week.total_minutes ?? "—"}</div>
                <div className="text-[10px] text-slate-500">minutes</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-400">{dashboard?.fitness_this_week.total_calories_burned || "—"}</div>
                <div className="text-[10px] text-slate-500">kcal burned</div>
              </div>
            </div>
            {dashboard?.fitness_this_week.types?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {dashboard.fitness_this_week.types.map(t => (
                  <span key={t} className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full capitalize">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Nutrition row */}
          <div className="bg-bg-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-400">Nutrition This Week</h3>
              <Utensils size={12} className="text-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Avg Calories</span>
                  <span className="text-[10px] text-slate-600">target {calorieTarget}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${avgCal && avgCal > calorieTarget ? "bg-red-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(((avgCal || 0) / calorieTarget) * 100, 100)}%` }}
                  />
                </div>
                <div className={`text-sm font-bold mt-1 ${avgCal && avgCal > calorieTarget ? "text-red-400" : "text-amber-400"}`}>
                  {avgCal ? `${avgCal} kcal` : "No data"}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-500">Avg Protein</span>
                  <span className="text-[10px] text-slate-600">target {proteinTarget}g</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${avgPro && avgPro >= proteinTarget ? "bg-emerald-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(((avgPro || 0) / proteinTarget) * 100, 100)}%` }}
                  />
                </div>
                <div className={`text-sm font-bold mt-1 ${avgPro && avgPro >= proteinTarget ? "text-emerald-400" : "text-blue-400"}`}>
                  {avgPro ? `${avgPro}g` : "No data"}
                </div>
              </div>
            </div>
            {dashboard?.nutrition_this_week.total_meals_logged != null && (
              <p className="text-[10px] text-slate-600 mt-2">{dashboard.nutrition_this_week.total_meals_logged} meals logged this week</p>
            )}
          </div>

          {/* Budget row */}
          {budgetSummary && (
            <div className="bg-bg-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400">Budget This Week</h3>
                <Wallet size={12} className="text-amber-500" />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">CHF {budgetSummary.this_week.total.toFixed(0)}</div>
                  <div className="text-[10px] text-slate-500">spent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-400">CHF {budgetSummary.last_week.total.toFixed(0)}</div>
                  <div className="text-[10px] text-slate-500">last week</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-300">CHF {budgetSummary.this_month.total.toFixed(0)}</div>
                  <div className="text-[10px] text-slate-500">this month</div>
                </div>
              </div>
              {Object.keys(budgetSummary.this_week.by_category).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(budgetSummary.this_week.by_category)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([cat, amt]) => (
                      <span key={cat} className="text-[9px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full capitalize">
                        {cat} CHF {amt.toFixed(0)}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── WEIGHT TAB ── */}
      {tab === "Weight" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={Scale} value={current?.toFixed(1)} label="Current kg" color="text-blue-400" />
            <div className="bg-bg-card rounded-xl p-3 text-center">
              <div className={`text-xl font-bold ${weekChange != null ? (weekChange <= 0 ? "text-emerald-400" : "text-red-400") : "text-slate-600"}`}>
                {weekChange != null ? (weekChange > 0 ? `+${weekChange}` : weekChange) : "—"}
              </div>
              <div className="text-[10px] text-slate-500">week change</div>
            </div>
            <StatCard icon={Target} value={toTarget != null ? `${toTarget}kg` : null} label="to goal (81)" color="text-amber-400" />
          </div>

          {weightSlice.length > 1 && (
            <div className="bg-bg-card rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3">Last {weightSlice.length} Days</h3>
              <Line data={weightLineData} options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, min: Math.floor(Math.min(...weightSlice.map(w => w.weight_kg)) - 1), max: Math.ceil(Math.max(...weightSlice.map(w => w.weight_kg)) + 1) } } }} />
            </div>
          )}

          <div className="bg-bg-card rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-2">Log Today's Weight</h3>
            <div className="flex gap-2">
              <input
                type="number" step="0.1"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                placeholder="98.5"
                className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleLogWeight}
                disabled={loggingWeight || !weightInput}
                className="px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg text-sm font-medium disabled:opacity-40"
              >
                {loggingWeight ? "…" : "Log"}
              </button>
            </div>
            {weightSaved && <p className="text-xs text-emerald-400 mt-2">✓ Weight logged!</p>}
          </div>

          {weights.length > 0 && (
            <div className="bg-bg-card rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">History</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {[...weights].reverse().map((w, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-800 last:border-0">
                    <span className="text-xs text-slate-500">{w.date}</span>
                    <span className="text-sm font-semibold text-slate-200">{w.weight_kg} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── FITNESS TAB ── */}
      {tab === "Fitness" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={Activity} value={dashboard?.fitness_this_week.workouts ?? "—"} label="sessions" color="text-emerald-400" sub="this week" />
            <StatCard icon={Flame} value={dashboard?.fitness_this_week.total_calories_burned || "—"} label="kcal burned" color="text-amber-400" sub="this week" />
            <StatCard icon={Target} value={dashboard?.fitness_this_week.total_minutes ?? "—"} label="minutes" color="text-blue-400" sub="this week" />
          </div>

          <div className="bg-bg-card rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-3">Sessions — Last 14 Days</h3>
            <Bar data={workoutBarData} options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, ticks: { ...CHART_OPTS.scales.y.ticks, stepSize: 1 }, min: 0 } } }} />
          </div>

          {workouts.length > 0 && (
            <div className="bg-bg-card rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3">Recent Sessions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...workouts].reverse().slice(0, 15).map((w, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                    <div>
                      <span className="text-xs font-medium text-slate-200 capitalize">{w.type}</span>
                      <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full capitalize ${
                        w.intensity === "high" ? "bg-red-900/40 text-red-400" :
                        w.intensity === "moderate" ? "bg-amber-900/40 text-amber-400" :
                        "bg-emerald-900/40 text-emerald-400"
                      }`}>{w.intensity}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{w.duration}min</div>
                      <div className="text-[10px] text-slate-600">{w.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashboard?.fitness_this_week.types?.length > 0 && (
            <div className="bg-bg-card rounded-xl p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-2">Activity Mix This Week</h3>
              <div className="flex flex-wrap gap-1.5">
                {dashboard.fitness_this_week.types.map(t => (
                  <span key={t} className="text-xs bg-emerald-900/30 text-emerald-300 px-3 py-1 rounded-full capitalize">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NUTRITION TAB ── */}
      {tab === "Nutrition" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bg-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Avg Calories</span>
                <Flame size={12} className="text-amber-400" />
              </div>
              <div className={`text-2xl font-bold ${avgCal && avgCal > calorieTarget ? "text-red-400" : "text-amber-400"}`}>
                {avgCal ?? "—"}
              </div>
              <div className="text-[10px] text-slate-600">target: {calorieTarget} kcal</div>
              <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${avgCal && avgCal > calorieTarget ? "bg-red-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(((avgCal || 0) / calorieTarget) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-bg-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Avg Protein</span>
                <Activity size={12} className="text-emerald-400" />
              </div>
              <div className={`text-2xl font-bold ${avgPro && avgPro >= proteinTarget ? "text-emerald-400" : "text-blue-400"}`}>
                {avgPro ? `${avgPro}g` : "—"}
              </div>
              <div className="text-[10px] text-slate-600">target: {proteinTarget}g</div>
              <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${avgPro && avgPro >= proteinTarget ? "bg-emerald-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.min(((avgPro || 0) / proteinTarget) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-bg-card rounded-xl p-4">
            <p className="text-xs text-slate-500 text-center py-2">
              Log meals in the <span className="text-amber-400">Meals</span> tab to see weekly breakdowns here.
            </p>
            {dashboard?.nutrition_this_week.total_meals_logged != null && (
              <p className="text-xs text-slate-600 text-center mt-1">
                {dashboard.nutrition_this_week.total_meals_logged} meals logged this week
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
