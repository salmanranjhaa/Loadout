import { useState, useEffect } from "react";
import { PlusCircle, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { budgetAPI } from "../utils/api";

const CATEGORIES = [
  { id: "food", label: "Food", emoji: "🍔", color: "text-amber-400", bg: "bg-amber-950/30", bar: "bg-amber-500" },
  { id: "transport", label: "Transport", emoji: "🚌", color: "text-blue-400", bg: "bg-blue-950/30", bar: "bg-blue-500" },
  { id: "uni", label: "Uni", emoji: "🎓", color: "text-purple-400", bg: "bg-purple-950/30", bar: "bg-purple-500" },
  { id: "health", label: "Health", emoji: "💊", color: "text-emerald-400", bg: "bg-emerald-950/30", bar: "bg-emerald-500" },
  { id: "entertainment", label: "Fun", emoji: "🎮", color: "text-pink-400", bg: "bg-pink-950/30", bar: "bg-pink-500" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", color: "text-orange-400", bg: "bg-orange-950/30", bar: "bg-orange-500" },
  { id: "other", label: "Other", emoji: "📦", color: "text-slate-400", bg: "bg-slate-800/50", bar: "bg-slate-500" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCatMeta(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[6];
}

function getWeekDates() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export default function BudgetPage() {
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [period, setPeriod] = useState("week");

  // Form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadData(); }, [period]);

  async function loadData() {
    try {
      const [s, e] = await Promise.all([budgetAPI.getSummary(), budgetAPI.getAll(period)]);
      setSummary(s);
      setEntries(e.entries);
    } catch {/* silently fail */}
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setAdding(true);
    try {
      await budgetAPI.add({ amount: parseFloat(amount), category, description: description || null });
      setAmount("");
      setDescription("");
      await loadData();
    } catch (err) {
      alert(err.message);
    }
    setAdding(false);
  }

  async function handleDelete(id) {
    try {
      await budgetAPI.delete(id);
      setEntries(es => es.filter(e => e.id !== id));
      await loadData();
    } catch {/* ignore */}
  }

  const weekDates = getWeekDates();
  const maxDaily = summary ? Math.max(...weekDates.map(d => summary.this_week.daily[d] || 0), 1) : 1;
  const weekTotal = summary?.this_week.total || 0;
  const lastWeekTotal = summary?.last_week.total || 0;
  const weekChange = weekTotal - lastWeekTotal;
  const byCategory = summary?.this_week.by_category || {};
  const maxCat = Math.max(...Object.values(byCategory), 1);

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-4">
        Budget
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-bg-card rounded-xl p-3 text-center">
          <Wallet size={14} className="text-amber-400 mx-auto mb-1" />
          <div className="text-lg font-bold text-amber-400">CHF {weekTotal.toFixed(0)}</div>
          <div className="text-[10px] text-slate-500">this week</div>
        </div>
        <div className="bg-bg-card rounded-xl p-3 text-center">
          {weekChange <= 0
            ? <TrendingDown size={14} className="text-emerald-400 mx-auto mb-1" />
            : <TrendingUp size={14} className="text-red-400 mx-auto mb-1" />}
          <div className={`text-lg font-bold ${weekChange <= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {weekChange >= 0 ? "+" : ""}{weekChange.toFixed(0)}
          </div>
          <div className="text-[10px] text-slate-500">vs last week</div>
        </div>
        <div className="bg-bg-card rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-slate-300">CHF {(summary?.this_month.total || 0).toFixed(0)}</div>
          <div className="text-[10px] text-slate-500">this month</div>
        </div>
      </div>

      {/* Add expense */}
      <div className="bg-bg-card rounded-xl p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Add Expense</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          {/* Category grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`flex flex-col items-center py-2 rounded-lg text-[10px] transition-all ${
                  category === c.id
                    ? `${c.bg} ${c.color} ring-1 ring-current`
                    : "bg-slate-800/60 text-slate-500"
                }`}
              >
                <span className="text-base mb-0.5">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                step="0.05"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="CHF amount"
                className="w-full bg-slate-800/60 rounded-xl px-3 py-2.5 text-sm border border-slate-700 focus:border-amber-500 focus:outline-none text-white"
              />
            </div>
            <button
              type="submit"
              disabled={adding || !amount}
              className="px-4 py-2.5 bg-amber-600/20 text-amber-300 rounded-xl text-sm font-medium hover:bg-amber-600/30 transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <PlusCircle size={14} />
              Add
            </button>
          </div>

          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-slate-800/60 rounded-xl px-3 py-2 text-sm border border-slate-700 focus:border-amber-500 focus:outline-none text-white placeholder-slate-600"
          />
        </form>
      </div>

      {/* Daily bar chart */}
      {summary && (
        <div className="bg-bg-card rounded-xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-slate-400 mb-3">This Week (CHF)</h3>
          <div className="flex items-end gap-1 h-20">
            {weekDates.map((d, i) => {
              const val = summary.this_week.daily[d] || 0;
              const heightPct = (val / maxDaily) * 80 + (val > 0 ? 10 : 0);
              return (
                <div key={d} className="flex-1 flex flex-col items-center gap-1">
                  {val > 0 && <span className="text-[8px] text-slate-500">{val.toFixed(0)}</span>}
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-400 transition-all"
                    style={{ height: `${heightPct}%`, minHeight: val > 0 ? "4px" : "2px" }}
                  />
                  <span className="text-[8px] text-slate-600">{DAY_LABELS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-bg-card rounded-xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-slate-400 mb-3">By Category</h3>
          <div className="space-y-2">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
              const meta = getCatMeta(cat);
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-sm">{meta.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs text-slate-400 capitalize">{cat}</span>
                      <span className={`text-xs font-semibold ${meta.color}`}>CHF {amt.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${meta.bar} transition-all`}
                        style={{ width: `${(amt / maxCat) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Period toggle + transactions */}
      <div className="flex gap-2 mb-3">
        {["week", "month", "30"].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === p ? "bg-slate-700 text-slate-200" : "bg-bg-card text-slate-500"
            }`}
          >
            {p === "week" ? "This week" : p === "month" ? "This month" : "30 days"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-center text-xs text-slate-600 py-6">No expenses logged yet.</p>
        ) : (
          entries.map(e => {
            const meta = getCatMeta(e.category);
            return (
              <div key={e.id} className={`flex items-center gap-3 p-3 rounded-xl ${meta.bg}`}>
                <span className="text-lg">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-200">CHF {e.amount.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-600">{e.date}</span>
                  </div>
                  {e.description && <p className="text-xs text-slate-500 truncate">{e.description}</p>}
                  <span className={`text-[10px] capitalize ${meta.color}`}>{e.category}</span>
                </div>
                <button onClick={() => handleDelete(e.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
