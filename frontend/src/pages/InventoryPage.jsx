import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Package } from "lucide-react";
import { inventoryAPI } from "../utils/api";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "protein", label: "Protein", color: "text-red-400", bg: "bg-red-900/20" },
  { id: "carbs", label: "Carbs", color: "text-amber-400", bg: "bg-amber-900/20" },
  { id: "veggies", label: "Veggies", color: "text-emerald-400", bg: "bg-emerald-900/20" },
  { id: "dairy", label: "Dairy", color: "text-blue-400", bg: "bg-blue-900/20" },
  { id: "fats", label: "Fats", color: "text-yellow-400", bg: "bg-yellow-900/20" },
  { id: "spices", label: "Spices", color: "text-orange-400", bg: "bg-orange-900/20" },
  { id: "other", label: "Other", color: "text-slate-400", bg: "bg-slate-800/60" },
];

const UNITS = ["g", "kg", "pieces", "tbsp", "tsp", "cups", "L", "ml", "cans", "portions"];

function categoryStyle(cat) {
  return CATEGORIES.find(c => c.id === cat) || CATEGORIES.find(c => c.id === "other");
}

function AddItemForm({ onAdded, onCancel }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("g");
  const [category, setCategory] = useState("other");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdded({ name: name.trim(), quantity: quantity ? Number(quantity) : null, unit, category });
      setName(""); setQuantity(""); setUnit("g"); setCategory("other");
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  return (
    <div className="bg-bg-card rounded-xl p-4 border border-slate-700 space-y-3">
      <p className="text-xs font-semibold text-slate-400">Add Item</p>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Item name (e.g. Chicken breast)"
        className="w-full bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-emerald-500 focus:outline-none"
        onKeyDown={e => e.key === "Enter" && handleAdd()}
        autoFocus
      />
      <div className="flex gap-2">
        <input
          type="number"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="Qty"
          className="w-20 bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-emerald-500 focus:outline-none"
          min={0}
        />
        <select
          value={unit}
          onChange={e => setUnit(e.target.value)}
          className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-emerald-500 focus:outline-none"
        >
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.filter(c => c.id !== "all").map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] transition-all ${
              category === c.id ? `${c.bg} ${c.color} ring-1 ring-current` : "bg-slate-800 text-slate-500"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 text-xs text-slate-500 bg-slate-800/60 rounded-lg">
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={saving || !name.trim()}
          className="flex-1 py-2 text-xs text-emerald-300 bg-emerald-600/20 rounded-lg hover:bg-emerald-600/30 disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          <Check size={13} />
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}

function InventoryItemRow({ item, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(item.quantity ?? "");
  const [unit, setUnit] = useState(item.unit || "g");
  const [saving, setSaving] = useState(false);
  const style = categoryStyle(item.category);

  async function saveEdit() {
    setSaving(true);
    try {
      await onUpdate(item.id, { quantity: qty ? Number(qty) : null, unit });
      setEditing(false);
    } catch (e) {
      alert(e.message);
    }
    setSaving(false);
  }

  return (
    <div className="bg-bg-card rounded-xl px-3 py-2.5 flex items-center gap-3">
      <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${style.bg} ${style.color}`}>
        {style.label}
      </span>
      <span className="flex-1 text-sm text-slate-200 truncate">{item.name}</span>

      {editing ? (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            type="number"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-16 bg-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
            min={0}
          />
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="bg-slate-800 rounded px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <button onClick={saveEdit} disabled={saving} className="p-1 text-emerald-400 hover:text-emerald-300">
            <Check size={13} />
          </button>
          <button onClick={() => setEditing(false)} className="p-1 text-slate-600 hover:text-slate-400">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.quantity != null && (
            <span className="text-xs text-slate-400">{item.quantity} {item.unit}</span>
          )}
          <button onClick={() => setEditing(true)} className="p-1 text-slate-600 hover:text-amber-400">
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-slate-700 hover:text-red-400">
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const data = await inventoryAPI.getAll();
      setItems(data.items);
    } catch { /* silently fail */ }
  }

  async function handleAdd(data) {
    const item = await inventoryAPI.add(data);
    setItems(prev => [...prev, item]);
    setShowAdd(false);
  }

  async function handleUpdate(id, data) {
    const updated = await inventoryAPI.update(id, data);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
  }

  async function handleDelete(id) {
    await inventoryAPI.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const filtered = filter === "all" ? items : items.filter(i => i.category === filter);

  const countByCategory = items.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
            <Package size={20} className="text-teal-400" />
            Inventory
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">What's in your kitchen — AI uses this for recipe suggestions</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="p-2 bg-teal-600/20 text-teal-400 rounded-xl hover:bg-teal-600/30 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {showAdd && (
        <div className="mb-4">
          <AddItemForm onAdded={handleAdd} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-4 pb-1">
        {CATEGORIES.map(c => {
          const count = c.id === "all" ? items.length : (countByCategory[c.id] || 0);
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] transition-all flex items-center gap-1 ${
                filter === c.id
                  ? `${c.bg || "bg-slate-700"} ${c.color || "text-slate-300"} ring-1 ring-current`
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {c.label}
              {count > 0 && <span className="text-[9px] opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Item list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm">
          {items.length === 0
            ? <>No items yet. Tap <span className="text-teal-400">+</span> to add what's in your kitchen.</>
            : "No items in this category."}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(item => (
            <InventoryItemRow
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-600 text-center mt-6">
        {items.length} item{items.length !== 1 ? "s" : ""} · AI reads this when suggesting recipes &amp; grocery lists
      </p>
    </div>
  );
}
