import { useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6am to 11pm

// I define the calendar events matching the seed data (including IRI)
const EVENTS = {
  0: [ // Monday
    { start: 6.5, dur: 0.25, title: "Supplements", color: "bg-slate-600" },
    { start: 6.75, dur: 0.5, title: "Stretch", color: "bg-emerald-700" },
    { start: 7, dur: 0.5, title: "Breakfast", color: "bg-amber-700" },
    { start: 8, dur: 2, title: "THESIS", color: "bg-red-700" },
    { start: 10.25, dur: 1.75, title: "Hacking Lab", color: "bg-indigo-700" },
    { start: 12.25, dur: 0.5, title: "Lunch", color: "bg-amber-700" },
    { start: 13, dur: 2, title: "IRI Work", color: "bg-cyan-700" },
    { start: 15, dur: 1.5, title: "Job Hunt", color: "bg-orange-700" },
    { start: 16.5, dur: 0.5, title: "Snack", color: "bg-amber-700" },
    { start: 17.5, dur: 1, title: "CrossFit", color: "bg-emerald-700" },
    { start: 18.5, dur: 0.5, title: "Shower + Shake", color: "bg-slate-600" },
    { start: 19, dur: 2, title: "Chess", color: "bg-purple-700" },
    { start: 21, dur: 0.5, title: "Dinner", color: "bg-amber-700" },
    { start: 21.5, dur: 0.5, title: "Wind Down", color: "bg-slate-600" },
  ],
  1: [ // Tuesday
    { start: 6.25, dur: 0.25, title: "Supplements", color: "bg-slate-600" },
    { start: 6.75, dur: 0.75, title: "Running", color: "bg-emerald-700" },
    { start: 7.5, dur: 0.75, title: "Shower", color: "bg-slate-600" },
    { start: 8.25, dur: 0.5, title: "Breakfast", color: "bg-amber-700" },
    { start: 9, dur: 3, title: "THESIS", color: "bg-red-700" },
    { start: 12, dur: 0.5, title: "Lunch", color: "bg-amber-700" },
    { start: 12.5, dur: 1, title: "Yoga", color: "bg-emerald-700" },
    { start: 14.25, dur: 1.5, title: "Football", color: "bg-emerald-700" },
    { start: 16, dur: 1.5, title: "German Study", color: "bg-indigo-700" },
    { start: 17.5, dur: 0.5, title: "Snack", color: "bg-amber-700" },
    { start: 18, dur: 1.5, title: "Job Hunt", color: "bg-orange-700" },
    { start: 19.5, dur: 0.5, title: "Dinner", color: "bg-amber-700" },
    { start: 21.5, dur: 0.5, title: "Wind Down", color: "bg-slate-600" },
  ],
  2: [ // Wednesday
    { start: 6.25, dur: 0.25, title: "Supplements", color: "bg-slate-600" },
    { start: 6.5, dur: 0.75, title: "Travel", color: "bg-slate-600" },
    { start: 8, dur: 1, title: "CrossFit", color: "bg-emerald-700" },
    { start: 9, dur: 0.75, title: "Shower", color: "bg-slate-600" },
    { start: 9.75, dur: 0.5, title: "Breakfast", color: "bg-amber-700" },
    { start: 10, dur: 4, title: "IRI Work", color: "bg-cyan-700" },
    { start: 14, dur: 0.5, title: "Lunch", color: "bg-amber-700" },
    { start: 14.5, dur: 2, title: "THESIS", color: "bg-red-700" },
    { start: 16.5, dur: 0.5, title: "Snack", color: "bg-amber-700" },
    { start: 17, dur: 1.5, title: "Job Hunt", color: "bg-orange-700" },
    { start: 19, dur: 0.5, title: "Dinner", color: "bg-amber-700" },
    { start: 21.5, dur: 0.5, title: "Wind Down", color: "bg-slate-600" },
  ],
  3: [ // Thursday
    { start: 6.25, dur: 0.25, title: "Supplements", color: "bg-slate-600" },
    { start: 6.5, dur: 0.75, title: "Running", color: "bg-emerald-700" },
    { start: 7.25, dur: 0.75, title: "Shower", color: "bg-slate-600" },
    { start: 8, dur: 0.25, title: "Breakfast", color: "bg-amber-700" },
    { start: 8.25, dur: 3.75, title: "German Class", color: "bg-indigo-700" },
    { start: 12, dur: 0.5, title: "Lunch", color: "bg-amber-700" },
    { start: 12.5, dur: 1, title: "Indoor Cycling", color: "bg-emerald-700" },
    { start: 13.5, dur: 0.75, title: "Shower + Snack", color: "bg-slate-600" },
    { start: 14.25, dur: 3.75, title: "Simulation", color: "bg-indigo-700" },
    { start: 18, dur: 0.5, title: "Dinner", color: "bg-amber-700" },
    { start: 18.5, dur: 3.5, title: "FCS / Thesis", color: "bg-red-700" },
    { start: 22, dur: 0.5, title: "Wind Down", color: "bg-slate-600" },
  ],
  4: [ // Friday
    { start: 6.25, dur: 0.25, title: "Supplements", color: "bg-slate-600" },
    { start: 6.5, dur: 0.75, title: "Travel", color: "bg-slate-600" },
    { start: 8, dur: 1, title: "CrossFit", color: "bg-emerald-700" },
    { start: 9, dur: 0.75, title: "Shower", color: "bg-slate-600" },
    { start: 9.75, dur: 0.5, title: "Breakfast", color: "bg-amber-700" },
    { start: 10.25, dur: 1.75, title: "THESIS", color: "bg-red-700" },
    { start: 12.25, dur: 1.75, title: "FCS + Grundlagen", color: "bg-indigo-700" },
    { start: 14, dur: 0.5, title: "Lunch", color: "bg-amber-700" },
    { start: 14.5, dur: 2, title: "FCS Prep", color: "bg-indigo-700" },
    { start: 16.5, dur: 0.5, title: "Snack", color: "bg-amber-700" },
    { start: 17, dur: 1.5, title: "Job Hunt", color: "bg-orange-700" },
    { start: 19, dur: 0.5, title: "Dinner", color: "bg-amber-700" },
    { start: 21.5, dur: 0.5, title: "Wind Down", color: "bg-slate-600" },
  ],
  5: [ // Saturday
    { start: 7.5, dur: 0.25, title: "Supplements", color: "bg-slate-600" },
    { start: 8, dur: 1, title: "Long Run", color: "bg-emerald-700" },
    { start: 9, dur: 0.75, title: "Shower", color: "bg-slate-600" },
    { start: 9.75, dur: 0.5, title: "Breakfast", color: "bg-amber-700" },
    { start: 10.5, dur: 2, title: "Meal Prep", color: "bg-amber-800" },
    { start: 12.5, dur: 0.5, title: "Lunch", color: "bg-amber-700" },
    { start: 13, dur: 1, title: "Groceries", color: "bg-slate-600" },
    { start: 14.25, dur: 1.5, title: "Football", color: "bg-emerald-700" },
    { start: 16, dur: 2, title: "Thesis", color: "bg-red-700" },
    { start: 18.5, dur: 0.5, title: "Dinner", color: "bg-amber-700" },
    { start: 19, dur: 2, title: "Free Time", color: "bg-purple-700" },
    { start: 22, dur: 0.5, title: "Wind Down", color: "bg-slate-600" },
  ],
  6: [ // Sunday
    { start: 8.5, dur: 0.25, title: "Supplements", color: "bg-slate-600" },
    { start: 8.75, dur: 0.5, title: "Breakfast", color: "bg-amber-700" },
    { start: 9.5, dur: 0.5, title: "Stretch", color: "bg-emerald-700" },
    { start: 10, dur: 0.5, title: "Planning", color: "bg-slate-600" },
    { start: 10.5, dur: 2, title: "THESIS", color: "bg-red-700" },
    { start: 12.5, dur: 0.5, title: "Lunch", color: "bg-amber-700" },
    { start: 13, dur: 1.5, title: "Meal Prep", color: "bg-amber-800" },
    { start: 14.5, dur: 2, title: "Courses", color: "bg-indigo-700" },
    { start: 16.5, dur: 0.5, title: "Snack", color: "bg-amber-700" },
    { start: 17, dur: 1.5, title: "Job Hunt", color: "bg-orange-700" },
    { start: 19, dur: 0.5, title: "Dinner", color: "bg-amber-700" },
    { start: 20, dur: 1.5, title: "Free Time", color: "bg-purple-700" },
    { start: 21.5, dur: 0.5, title: "Wind Down", color: "bg-slate-600" },
  ],
};

export default function CalendarPage() {
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div className="px-2 pt-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-slate-200 mb-3 px-2">Weekly Calendar</h1>

      {/* I render a compact weekly calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* I render the day headers */}
          <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-0.5 mb-1">
            <div />
            {DAYS.map((d, i) => (
              <div
                key={d}
                className={`text-center text-[10px] font-semibold py-1 rounded ${
                  i === todayIdx ? "text-emerald-400 bg-emerald-900/20" : "text-slate-500"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* I render the time grid */}
          <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-0.5 relative">
            {/* I render the hour labels */}
            {HOURS.map(h => (
              <div
                key={h}
                className="text-[9px] text-slate-600 text-right pr-1 font-mono"
                style={{ gridRow: `${(h - 6) * 4 + 1} / span 4`, gridColumn: 1 }}
              >
                {h}:00
              </div>
            ))}

            {/* I render the background grid */}
            {HOURS.map(h =>
              DAYS.map((_, di) => (
                <div
                  key={`${h}-${di}`}
                  className="border-t border-slate-800/50"
                  style={{
                    gridRow: `${(h - 6) * 4 + 1} / span 4`,
                    gridColumn: di + 2,
                  }}
                />
              ))
            )}

            {/* I render the events */}
            {Object.entries(EVENTS).map(([dayIdx, dayEvents]) =>
              dayEvents.map((ev, i) => {
                const startRow = Math.round((ev.start - 6) * 4) + 1;
                const spanRows = Math.max(Math.round(ev.dur * 4), 1);
                return (
                  <div
                    key={`${dayIdx}-${i}`}
                    className={`${ev.color} rounded-sm px-0.5 overflow-hidden flex items-start`}
                    style={{
                      gridRow: `${startRow} / span ${spanRows}`,
                      gridColumn: parseInt(dayIdx) + 2,
                      fontSize: "8px",
                      lineHeight: "1.2",
                      minHeight: 0,
                    }}
                  >
                    <span className="text-white/90 font-medium truncate">{ev.title}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* I render the color legend */}
      <div className="flex flex-wrap gap-2 mt-4 px-2">
        {[
          { color: "bg-red-700", label: "Thesis/Focus" },
          { color: "bg-orange-700", label: "Job Hunt" },
          { color: "bg-indigo-700", label: "Classes" },
          { color: "bg-cyan-700", label: "IRI Work" },
          { color: "bg-emerald-700", label: "Exercise" },
          { color: "bg-amber-700", label: "Meals" },
          { color: "bg-purple-700", label: "Social" },
          { color: "bg-slate-600", label: "Routine" },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1 text-[9px] text-slate-400">
            <span className={`w-2 h-2 rounded-sm ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
