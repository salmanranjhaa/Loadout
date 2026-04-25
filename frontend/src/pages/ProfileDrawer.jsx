import { useState } from "react";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";
import {
  PageScroll, SettingsRow, SettingsGroup, Toggle, Chip,
} from "../design/components";
import { userAPI } from "../utils/api";

// ── Avatar hero ────────────────────────────────────────────────────────────────
function AvatarHero({ profile }) {
  const name = profile?.full_name || profile?.username || "Athlete";
  const email = profile?.email || "";
  const daysIn = profile?.days_active || profile?.streak_days || 128;
  const streak = profile?.current_streak || 42;

  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ padding: "28px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {/* Avatar circle */}
      <div style={{
        width: 80, height: 80, borderRadius: 9999,
        background: `conic-gradient(from 135deg, ${T.violet}, ${T.teal}, ${T.violet})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, fontWeight: 800, color: "#0A0A0F",
        letterSpacing: -0.5,
        boxShadow: `0 0 0 3px ${T.surface}, 0 0 0 5px ${T.border}, 0 8px 24px ${T.violet}44`,
      }}>
        {initials}
      </div>

      {/* Name */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text, letterSpacing: -0.4 }}>{name}</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{email}</div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, fontFamily: T.fontMono }}>
          {daysIn} days in
        </div>
      </div>

      {/* Streak chip */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 12px",
        background: `${T.amber}18`,
        border: `1px solid ${T.amber}44`,
        borderRadius: 9999,
      }}>
        <Icon name="fire" size={14} color={T.amber} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.amber }}>
          {streak} day streak
        </span>
      </div>
    </div>
  );
}

// ── Supplement item in settings ────────────────────────────────────────────────
function SupplementItem({ sup, last }) {
  return (
    <div style={{
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      borderBottom: last ? "none" : `0.5px solid ${T.border}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: `${T.violet}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name="pill" size={14} color={T.violet} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{sup.name}</div>
        {sup.dose && (
          <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.fontMono, marginTop: 1 }}>{sup.dose}</div>
        )}
      </div>
      {/* Time chips */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {(sup.times || sup.time ? [sup.time || "Morning"] : []).map((t, i) => (
          <span key={i} style={{
            fontSize: 9, fontWeight: 600, color: T.textMuted,
            padding: "2px 6px", background: T.elevated2, borderRadius: 5,
            border: `1px solid ${T.border}`,
            whiteSpace: "nowrap",
          }}>
            {t}
          </span>
        ))}
      </div>
      <Icon name="chev-right" size={13} color={T.textDim} />
    </div>
  );
}

// ── Main drawer ────────────────────────────────────────────────────────────────
export default function ProfileDrawer({ profile, onClose, onLogout, onProfileUpdate, onFullProfile }) {
  const [notifSettings, setNotifSettings] = useState({
    mealReminders: true,
    workoutReminders: true,
    supplementReminders: false,
    weeklySummary: true,
  });

  function toggle(key) {
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const p = profile || {};
  const supplements = Array.isArray(p.supplements) && p.supplements.length > 0
    ? p.supplements
    : [
        { name: "Magnesium", dose: "400mg", times: ["Evening"] },
        { name: "Vitamin D", dose: "2000 IU", times: ["Morning"] },
        { name: "Omega-3", dose: "1g", times: ["Morning"] },
      ];

  const fmt = (v, unit = "") => v != null ? `${v}${unit}` : "—";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: T.bg,
      display: "flex", flexDirection: "column",
      animation: "slideInRight 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.6; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px 10px",
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{
            width: 34, height: 34, borderRadius: 9999,
            background: T.elevated, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: T.text, flexShrink: 0,
          }}
        >
          <Icon name="chev-left" size={16} />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: -0.2 }}>
          Profile
        </div>
        <div style={{ width: 34 }} />
      </div>

      <PageScroll padBottom={60}>
        {/* Hero */}
        <AvatarHero profile={p} />

        {/* Full settings button */}
        {onFullProfile && (
          <div style={{ padding: "0 20px 16px" }}>
            <button
              onClick={onFullProfile}
              style={{
                width: "100%", padding: "12px 16px",
                background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 14,
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: `linear-gradient(135deg, ${T.violet}, ${T.teal})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name="settings" size={15} color="#0A0A0F" />
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Full settings</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>Goals, macros, AI coach, connected apps</div>
              </div>
              <Icon name="chev-right" size={14} color={T.textMuted} />
            </button>
          </div>
        )}

        {/* Body metrics */}
        <SettingsGroup title="Body metrics">
          <SettingsRow label="Height" value={fmt(p.height_cm, " cm")} />
          <SettingsRow label="Current weight" value={fmt(p.weight_kg, " kg")} />
          <SettingsRow label="Goal weight" value={fmt(p.goal_weight_kg, " kg")} />
          <SettingsRow label="Biological sex" value={p.sex || p.biological_sex || "—"} />
          <SettingsRow label="Activity level" value={p.activity_level || "—"} last />
        </SettingsGroup>

        {/* Macro targets */}
        <SettingsGroup title="Macro targets">
          <SettingsRow label="Calories" value={fmt(p.calorie_target || p.daily_calorie_target, " kcal")} />
          <SettingsRow label="Protein" value={fmt(p.protein_target || p.daily_protein_target, " g")} />
          <SettingsRow label="Carbs" value={fmt(p.carb_target || p.daily_carb_target, " g")} />
          <SettingsRow label="Fat" value={fmt(p.fat_target || p.daily_fat_target, " g")} last />
        </SettingsGroup>

        {/* Supplements */}
        <div style={{ padding: "0 20px 14px" }}>
          <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: 600, marginBottom: 8, paddingLeft: 4 }}>
            Supplements
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
            {supplements.map((sup, i) => (
              <SupplementItem key={i} sup={sup} last={i === supplements.length - 1} />
            ))}
            {/* Add supplement */}
            <button style={{
              width: "100%", padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              background: "none", border: "none",
              borderTop: `1px dashed ${T.border}`,
            }}>
              <Icon name="plus" size={14} color={T.textDim} />
              <span style={{ fontSize: 12, color: T.textDim, fontFamily: T.fontFamily }}>Add supplement</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <SettingsGroup title="Notifications">
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `0.5px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500, flex: 1 }}>Meal reminders</span>
            <Toggle on={notifSettings.mealReminders} onChange={() => toggle("mealReminders")} />
          </div>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `0.5px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500, flex: 1 }}>Workout reminders</span>
            <Toggle on={notifSettings.workoutReminders} onChange={() => toggle("workoutReminders")} />
          </div>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `0.5px solid ${T.border}` }}>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500, flex: 1 }}>Supplement reminders</span>
            <Toggle on={notifSettings.supplementReminders} onChange={() => toggle("supplementReminders")} />
          </div>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500, flex: 1 }}>Weekly summary</span>
            <Toggle on={notifSettings.weeklySummary} onChange={() => toggle("weeklySummary")} />
          </div>
        </SettingsGroup>

        {/* Connected services */}
        <SettingsGroup title="Connected services">
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: T.elevated2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="google" size={14} color={T.textMuted} />
            </div>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500, flex: 1 }}>Google Calendar</span>
            <span style={{ fontSize: 11, color: T.teal, fontWeight: 600 }}>Connected</span>
            <Icon name="chev-right" size={13} color={T.textDim} />
          </div>
        </SettingsGroup>

        {/* Preferences */}
        <SettingsGroup title="Preferences">
          <SettingsRow label="Currency" value="CHF" />
          <SettingsRow label="Units" value="Metric" />
          <SettingsRow label="Accent color" value="Teal" last />
        </SettingsGroup>

        {/* Full settings CTA */}
        <div style={{ padding: "4px 20px 8px" }}>
          <button
            onClick={onFullProfile}
            style={{
              width: "100%", padding: "13px",
              background: `${T.teal}18`,
              border: `1px solid ${T.teal}44`,
              borderRadius: 14,
              color: T.teal,
              fontSize: 14, fontWeight: 700,
              cursor: "pointer",
              fontFamily: T.fontFamily,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Icon name="analytics" size={16} color={T.teal} />
            Full profile &amp; settings
          </button>
        </div>

        {/* Sign out */}
        <div style={{ padding: "8px 20px 32px" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%", padding: "13px",
              background: "transparent",
              border: `1px solid ${T.negative}66`,
              borderRadius: 14,
              color: T.negative,
              fontSize: 14, fontWeight: 600,
              cursor: "pointer",
              fontFamily: T.fontFamily,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Icon name="logout" size={16} color={T.negative} />
            Sign out
          </button>
        </div>
      </PageScroll>
    </div>
  );
}
