import { useState, useEffect } from "react";
import { MapPin, ChevronDown, ChevronUp, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { scheduleAPI } from "../utils/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EVENT_TYPES = ["routine", "meal", "exercise", "focus", "class", "social", "work"];

const TYPE_COLORS = {
  routine: { bg: "bg-slate-800/50", border: "border-l-slate-500", text: "text-slate-400" },
  meal: { bg: "bg-amber-950/30", border: "border-l-amber-500", text: "text-amber-400" },
  exercise: { bg: "bg-emerald-950/30", border: "border-l-emerald-500", text: "text-emerald-400" },
  focus: { bg: "bg-red-950/20", border: "border-l-red-500", text: "text-red-300" },
  class: { bg: "bg-indigo-950/30", border: "border-l-indigo-500", text: "text-indigo-400" },
  social: { bg: "bg-purple-950/30", border: "border-l-purple-500", text: "text-purple-400" },
  work: { bg: "bg-cyan-950/30", border: "border-l-cyan-500", text: "text-cyan-400" },
};

const EMPTY_FORM = {
  title: "",
  event_type: "routine",
  start_time: "08:00",
  end_time: "09:00",
  location: "",
  description: "",
};

// ─── Compact inline form used for both create and edit ───────────────────────
function EventForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });

  function set(key, val) {
    setForm(p => ({ ...p, [key]: val }));
  }

  function handleSave() {
    if (!form.title.trim()) return;
    onSave(form);
  }

  const colors = TYPE_COLORS[form.event_type] || TYPE_COLORS.routine;

  return (
    <div className={`rounded-lg border border-slate-700 p-3 space-y-2 ${colors.bg}`}>
      {/* Title */}
      <input
        value={form.title}
        onChange={e => set("title", e.target.value)}
        placeholder="Event title"
        className="w-full bg-slate-800 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 ring-blue-500/50"
        autoFocus
      />

      {/* Event type pills */}
      <div className="flex gap-1 flex-wrap">
        {EVENT_TYPES.map(t => {
          const c = TYPE_COLORS[t];
          return (
            <button
              key={t}
              onClick={() => set("event_type", t)}
              className={`px-2 py-0.5 rounded-full text-[9px] capitalize transition-all ${
                form.event_type === t
                  ? `${c.bg} ${c.text} ring-1 ring-current`
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Time row */}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 flex-1">
          <label className="text-[10px] text-slate-500 w-8">From</label>
          <input
            type="time"
            value={form.start_time}
            onChange={e => set("start_time", e.target.value)}
            className="flex-1 bg-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-1">
          <label className="text-[10px] text-slate-500 w-5">To</label>
          <input
            type="time"
            value={form.end_time}
            onChange={e => set("end_time", e.target.value)}
            className="flex-1 bg-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
          />
        </div>
      </div>

      {/* Location + description */}
      <input
        value={form.location}
        onChange={e => set("location", e.target.value)}
        placeholder="Location (optional)"
        className="w-full bg-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
      />
      <input
        value={form.description}
        onChange={e => set("description", e.target.value)}
        placeholder="Notes (optional)"
        className="w-full bg-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
      />

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-1.5 text-[11px] text-slate-500 bg-slate-800/60 rounded-lg hover:text-slate-300"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="flex-1 py-1.5 text-[11px] text-blue-300 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 disabled:opacity-40 flex items-center justify-center gap-1"
        >
          <Check size={11} />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const todayIdx = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(todayIdx);
  const [expandedId, setExpandedId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // "create" shows the add-event form at the top; "edit" is an event id
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setCreating(false);
      setEditingId(null);
      try {
        const data = await scheduleAPI.getAll(selectedDay);
        setEvents(data.events);
      } catch {
        setEvents([]);
      }
      setLoading(false);
    }
    load();
  }, [selectedDay]);

  async function handleCreate(form) {
    setSaving(true);
    try {
      const created = await scheduleAPI.create({
        title: form.title,
        event_type: form.event_type,
        day_of_week: selectedDay,
        start_time: form.start_time,
        end_time: form.end_time,
        location: form.location || null,
        description: form.description || null,
        event_data: {},
      });
      setEvents(prev => [...prev, created].sort((a, b) => a.start_time.localeCompare(b.start_time)));
      setCreating(false);
    } catch (e) { alert(e.message); }
    setSaving(false);
  }

  async function handleEdit(eventId, form) {
    setSaving(true);
    try {
      const updated = await scheduleAPI.update(eventId, {
        title: form.title,
        start_time: form.start_time,
        end_time: form.end_time,
        description: form.description || null,
        event_data: {},
      });
      setEvents(prev =>
        prev.map(e => e.id === eventId ? { ...e, ...updated } : e)
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
      );
      setEditingId(null);
    } catch (e) { alert(e.message); }
    setSaving(false);
  }

  async function handleDelete(eventId) {
    try {
      await scheduleAPI.delete(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      if (expandedId === eventId) setExpandedId(null);
    } catch (e) { alert(e.message); }
  }

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
            Weekly Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-1">{DAY_FULL[selectedDay]}</p>
        </div>
        <button
          onClick={() => { setCreating(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-blue-300 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 transition-colors mt-1"
        >
          <Plus size={12} />
          Add Event
        </button>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => { setSelectedDay(i); setExpandedId(null); }}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedDay === i
                ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/50"
                : i === todayIdx
                  ? "bg-bg-card text-emerald-400 ring-1 ring-emerald-600/30"
                  : "bg-bg-card text-slate-500"
            }`}
          >
            {d}
            {i === todayIdx && selectedDay !== i && (
              <span className="ml-1 inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(TYPE_COLORS).map(([type, c]) => (
          <span key={type} className={`text-[10px] ${c.text} flex items-center gap-1`}>
            <span className={`w-2 h-2 rounded-sm ${c.border.replace("border-l-", "bg-")}`} />
            {type}
          </span>
        ))}
      </div>

      {/* Create form */}
      {creating && (
        <div className="mb-3">
          <EventForm
            initial={EMPTY_FORM}
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-1.5">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : events.length === 0 && !creating ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No events for {DAY_FULL[selectedDay]}.</p>
            <p className="text-xs mt-1">Tap "+ Add Event" to create one.</p>
          </div>
        ) : (
          events.map((event, i) => {
            const colors = TYPE_COLORS[event.event_type] || TYPE_COLORS.routine;
            const isExpanded = expandedId === event.id;
            const detail = event.event_data?.detail || event.description;
            const isEditing = editingId === event.id;

            if (isEditing) {
              return (
                <div key={event.id}>
                  <EventForm
                    initial={{
                      title: event.title,
                      event_type: event.event_type,
                      start_time: event.start_time?.slice(0, 5) || "08:00",
                      end_time: event.end_time?.slice(0, 5) || "09:00",
                      location: event.location || "",
                      description: event.description || "",
                    }}
                    onSave={form => handleEdit(event.id, form)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              );
            }

            return (
              <div
                key={event.id || i}
                className={`flex items-start gap-3 p-3 rounded-lg border-l-2 ${colors.border} ${colors.bg} transition-all group`}
              >
                {/* Time column */}
                <div className="w-[85px] flex-shrink-0 font-mono text-[11px] text-slate-500 pt-0.5">
                  {event.start_time?.slice(0, 5)}
                  {event.end_time && (
                    <span className="text-slate-600"> {event.end_time.slice(0, 5)}</span>
                  )}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 min-w-0 ${detail ? "cursor-pointer" : ""}`}
                  onClick={() => detail && setExpandedId(isExpanded ? null : event.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      event.event_type === "focus" ? "text-red-300 font-semibold" : "text-slate-200"
                    }`}>
                      {event.title}
                    </span>
                    {detail && (
                      isExpanded
                        ? <ChevronUp size={14} className="text-slate-600" />
                        : <ChevronDown size={14} className="text-slate-600" />
                    )}
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-slate-600" />
                      <span className="text-[10px] text-slate-600">{event.location}</span>
                    </div>
                  )}

                  {isExpanded && detail && (
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{detail}</p>
                  )}
                </div>

                {/* Edit / Delete buttons — always visible, subtle */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(event.id); setCreating(false); }}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-blue-400"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
