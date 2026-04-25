import { useState, useRef } from "react";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";
import { Toggle, SettingsGroup, SettingsRow } from "../design/components";
import { userAPI } from "../utils/api";

// Mascot — little teal robot face that glows after 5 taps
function Mascot({ glowing }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="12" fill={glowing ? T.teal : T.elevated2} style={{ transition: "fill 0.4s" }} />
      {/* Eyes */}
      <circle cx="15" cy="19" r="3.5" fill={glowing ? "#0A0A0F" : T.teal} style={{ transition: "fill 0.4s" }} />
      <circle cx="29" cy="19" r="3.5" fill={glowing ? "#0A0A0F" : T.teal} style={{ transition: "fill 0.4s" }} />
      {/* Smile */}
      <path d="M 16 28 Q 22 33 28 28" stroke={glowing ? "#0A0A0F" : T.teal} strokeWidth="2.2" strokeLinecap="round" fill="none" style={{ transition: "stroke 0.4s" }} />
      {/* Antenna */}
      <line x1="22" y1="8" x2="22" y2="13" stroke={glowing ? "#0A0A0F" : T.teal} strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="7" r="2" fill={glowing ? "#0A0A0F" : T.amber} style={{ transition: "fill 0.4s" }} />
    </svg>
  );
}

function AvatarHero({ profile, onAvatarTap, glowing }) {
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "LO";

  return (
    <div style={{
      padding: "28px 20px 20px",
      background: `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)`,
      borderBottom: `0.5px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
    }}>
      {/* Avatar */}
      <div style={{ position: "relative" }} onClick={onAvatarTap}>
        <div style={{
          width: 88, height: 88, borderRadius: 9999,
          background: glowing
            ? `radial-gradient(circle, ${T.teal}CC, ${T.violet}CC)`
            : `linear-gradient(135deg, ${T.violet}, ${T.teal})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 30, fontWeight: 800, color: "#0A0A0F",
          boxShadow: glowing ? `0 0 0 6px ${T.teal}44, 0 0 0 12px ${T.teal}22, 0 16px 48px ${T.teal}66` : `0 8px 32px ${T.violet}44`,
          transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          letterSpacing: 1,
          fontFamily: T.fontFamily,
        }}>
          {initials}
        </div>
        {/* Edit badge */}
        <div style={{
          position: "absolute", bottom: 2, right: 2,
          width: 24, height: 24, borderRadius: 9999,
          background: T.elevated, border: `1.5px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="camera" size={12} color={T.textDim} />
        </div>
        {glowing && (
          <div style={{
            position: "absolute", inset: -4, borderRadius: 9999,
            border: `2px solid ${T.teal}88`,
            animation: "lo-sparkle 1.5s ease-in-out infinite",
          }} />
        )}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: -0.5 }}>
          {profile?.full_name || "Loadout User"}
        </div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 3 }}>
          {profile?.email || ""}
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: 6, width: "100%" }}>
        {[
          { label: "Streak", value: "14d", icon: "flame", color: T.amber },
          { label: "Workouts", value: "128", icon: "dumbbell", color: T.teal },
          { label: "Member", value: "11mo", icon: "calendar", color: T.violet },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 0", textAlign: "center" }}>
            <Icon name={icon} size={15} color={color} />
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: T.fontMono, color: T.text, marginTop: 4 }}>{value}</div>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Mascot easter egg */}
      {glowing && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          background: `${T.teal}18`, border: `1px solid ${T.teal}44`, borderRadius: 12,
          width: "100%",
        }}>
          <Mascot glowing={glowing} />
          <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5, flex: 1 }}>
            Hey! I'm <b style={{ color: T.teal }}>Loadie</b> 🤖 — I live inside your data. You found me! Keep crushing those workouts.
          </div>
        </div>
      )}
    </div>
  );
}

export default function FullProfilePage({ profile, onClose, onLogout, onProfileUpdate }) {
  const [saving, setSaving] = useState(false);
  const [avatarTaps, setAvatarTaps] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const tapTimer = useRef(null);

  // Local editable state
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [editingName, setEditingName] = useState(false);

  function onAvatarTap() {
    setAvatarTaps(t => {
      const next = t + 1;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => setAvatarTaps(0), 1200);
      if (next >= 5) {
        setGlowing(true);
        setTimeout(() => setGlowing(false), 5000);
        return 0;
      }
      return next;
    });
  }

  async function saveName() {
    setSaving(true);
    try {
      const updated = await userAPI.updateProfile({ full_name: fullName });
      onProfileUpdate?.(updated);
    } catch {
      // ignore
    } finally {
      setSaving(false);
      setEditingName(false);
    }
  }

  const inputStyle = {
    flex: 1, background: T.elevated2, border: `1px solid ${T.teal}`,
    borderRadius: 8, padding: "6px 10px", fontSize: 13, color: T.text,
    outline: "none", fontFamily: T.fontFamily,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: T.bg, display: "flex", flexDirection: "column",
      fontFamily: T.fontFamily,
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", padding: "16px 16px 8px",
        borderBottom: `0.5px solid ${T.border}`, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{ width: 34, height: 34, borderRadius: 9999, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <Icon name="chev-left" size={16} />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: T.text }}>
          Profile & Settings
        </div>
        <div style={{ width: 34 }} />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 40 }}>
        <AvatarHero profile={profile} onAvatarTap={onAvatarTap} glowing={glowing} />

        {/* 1 · Identity */}
        <SettingsGroup title="Identity">
          <div style={{ padding: "12px 14px", borderBottom: `0.5px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Display Name</div>
            {editingName ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} autoFocus />
                <button onClick={saveName} disabled={saving} style={{ padding: "6px 14px", background: T.teal, border: "none", borderRadius: 8, color: "#0A0A0F", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  {saving ? "…" : "Save"}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: T.text, flex: 1 }}>{profile?.full_name || "—"}</span>
                <button onClick={() => setEditingName(true)} style={{ background: "none", border: "none", cursor: "pointer", color: T.teal, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>Edit</button>
              </div>
            )}
          </div>
          <SettingsRow label="Username" value={profile?.username || "—"} />
          <SettingsRow label="Email" value={profile?.email || "—"} />
          <SettingsRow label="Change Password" />
          <SettingsRow label="Connected accounts" last />
        </SettingsGroup>

        {/* 2 · Body */}
        <SettingsGroup title="Body Metrics">
          <SettingsRow label="Weight" value="82 kg" />
          <SettingsRow label="Height" value="183 cm" />
          <SettingsRow label="Age" value="28" />
          <SettingsRow label="Body Fat" value="14%" />
          <SettingsRow label="Goal" value="Cut · −500 kcal/day" last />
        </SettingsGroup>

        {/* 3 · Nutrition targets */}
        <SettingsGroup title="Nutrition Targets">
          <SettingsRow label="Daily Calories" value="2,600 kcal" />
          <SettingsRow label="Protein" value="200 g" />
          <SettingsRow label="Carbohydrates" value="300 g" />
          <SettingsRow label="Fat" value="85 g" />
          <SettingsRow label="Fiber" value="35 g" />
          <SettingsRow label="Water" value="3.5 L" last />
        </SettingsGroup>

        {/* 4 · Supplements */}
        <SettingsGroup title="Supplements">
          {[
            { name: "Whey Protein", dose: "30g", time: "Post-workout" },
            { name: "Creatine", dose: "5g", time: "Morning" },
            { name: "Omega-3", dose: "2 caps", time: "With food" },
            { name: "Vitamin D3", dose: "2000 IU", time: "Morning" },
            { name: "Magnesium", dose: "400mg", time: "Night" },
          ].map((s, i, arr) => (
            <div key={s.name} style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < arr.length - 1 ? `0.5px solid ${T.border}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.fontMono, marginTop: 2 }}>{s.dose} · {s.time}</div>
              </div>
              <Toggle on={true} onChange={() => {}} />
            </div>
          ))}
          <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", cursor: "pointer" }}>
            <Icon name="plus" size={14} color={T.teal} />
            <span style={{ fontSize: 13, color: T.teal, fontWeight: 600, marginLeft: 8 }}>Add supplement</span>
          </div>
        </SettingsGroup>

        {/* 5 · Workout prefs */}
        <SettingsGroup title="Training">
          <SettingsRow label="Primary sport" value="CrossFit" />
          <SettingsRow label="Weekly target" value="5 sessions" />
          <SettingsRow label="Default duration" value="60 min" />
          <SettingsRow label="Rest day" value="Sunday" />
          <SettingsRow label="HR zones" value="Configured" />
          <SettingsRow label="1RM benchmarks" last />
        </SettingsGroup>

        {/* 6 · Schedule */}
        <SettingsGroup title="Schedule">
          <SettingsRow label="Wake time" value="6:00 AM" />
          <SettingsRow label="Sleep time" value="10:30 PM" />
          <SettingsRow label="Meal times" value="7 · 12 · 3 · 7 PM" />
          <SettingsRow label="Work hours" value="9 AM – 5 PM" last />
        </SettingsGroup>

        {/* 7 · Budget */}
        <SettingsGroup title="Budget">
          <SettingsRow label="Monthly budget" value="$3,200" />
          <SettingsRow label="Grocery budget" value="$800" />
          <SettingsRow label="Dining out" value="$200" />
          <SettingsRow label="Supplements" value="$120" />
          <SettingsRow label="Currency" value="USD" last />
        </SettingsGroup>

        {/* 8 · Notifications */}
        <SettingsGroup title="Notifications">
          <SettingsRow label="Daily summary" toggle on={true} />
          <SettingsRow label="Meal reminders" toggle on={true} />
          <SettingsRow label="Workout reminders" toggle on={true} />
          <SettingsRow label="Supplement reminders" toggle on={true} />
          <SettingsRow label="Budget alerts" toggle on={false} />
          <SettingsRow label="Low pantry alerts" toggle on={true} />
          <SettingsRow label="Weekly progress report" toggle on={false} last />
        </SettingsGroup>

        {/* 9 · Connected services */}
        <SettingsGroup title="Connected Services">
          <SettingsRow label="Apple Health" value="Connected" />
          <SettingsRow label="Strava" value="Not connected" />
          <SettingsRow label="MyFitnessPal import" value="Not connected" />
          <SettingsRow label="Whoop" value="Not connected" />
          <SettingsRow label="Garmin" value="Not connected" last />
        </SettingsGroup>

        {/* 10 · AI / Claude */}
        <SettingsGroup title="AI Assistant">
          <SettingsRow label="AI model" value="Claude 3.5 Sonnet" />
          <SettingsRow label="Memory mode" value="Full context" />
          <SettingsRow label="Proactive suggestions" toggle on={true} />
          <SettingsRow label="Voice input" toggle on={false} />
          <SettingsRow label="Analysis frequency" value="Daily" last />
        </SettingsGroup>

        {/* 11 · Appearance */}
        <SettingsGroup title="Appearance">
          <SettingsRow label="Theme" value="Dark (OLED)" />
          <SettingsRow label="Accent color" value="Teal" />
          <SettingsRow label="Font size" value="Default" />
          <SettingsRow label="Reduce motion" toggle on={false} last />
        </SettingsGroup>

        {/* 12 · Privacy */}
        <SettingsGroup title="Privacy & Data">
          <SettingsRow label="Data sharing" value="Private" />
          <SettingsRow label="Analytics opt-in" toggle on={true} />
          <SettingsRow label="Export my data" />
          <SettingsRow label="Delete account data" danger />
          <SettingsRow label="Privacy policy" last />
        </SettingsGroup>

        {/* 13 · About */}
        <SettingsGroup title="About">
          <SettingsRow label="Version" value="v2.4.0" />
          <SettingsRow label="Build" value="20250425" />
          <SettingsRow label="Changelog" />
          <SettingsRow label="Send feedback" />
          <SettingsRow label="Rate the app" last />
        </SettingsGroup>

        {/* Sign out */}
        <div style={{ padding: "4px 20px 32px" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%", padding: "14px 0",
              background: `${T.negative}18`,
              border: `1px solid ${T.negative}44`,
              borderRadius: 14,
              color: T.negative,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: 0.1,
            }}
          >
            Sign out
          </button>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 11, color: T.textDim, paddingBottom: 20, fontFamily: T.fontMono }}>
          Loadedout · v2.4.0 · Made with{" "}
          <span style={{ color: T.teal }}>♥</span>{" "}
          by Loadedout
        </div>
      </div>
    </div>
  );
}
