import { useState, useRef } from "react";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";
import { Toggle } from "../design/components";
import { userAPI } from "../utils/api";

function Mascot({ glowing }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="12" fill={glowing ? T.teal : T.elevated2} style={{ transition: "fill 0.4s" }} />
      <circle cx="15" cy="19" r="3.5" fill={glowing ? "#0A0A0F" : T.teal} style={{ transition: "fill 0.4s" }} />
      <circle cx="29" cy="19" r="3.5" fill={glowing ? "#0A0A0F" : T.teal} style={{ transition: "fill 0.4s" }} />
      <path d="M 16 28 Q 22 33 28 28" stroke={glowing ? "#0A0A0F" : T.teal} strokeWidth="2.2" strokeLinecap="round" fill="none" style={{ transition: "stroke 0.4s" }} />
      <line x1="22" y1="8" x2="22" y2="13" stroke={glowing ? "#0A0A0F" : T.teal} strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="7" r="2" fill={glowing ? "#0A0A0F" : T.amber} style={{ transition: "fill 0.4s" }} />
    </svg>
  );
}

function AvatarHero({ profile, onAvatarTap, glowing }) {
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : (profile?.username || "LO").slice(0, 2).toUpperCase();

  return (
    <div style={{ padding: "28px 20px 20px", background: `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)`, borderBottom: `0.5px solid ${T.border}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative" }} onClick={onAvatarTap}>
        <div style={{ width: 88, height: 88, borderRadius: 9999, background: glowing ? `radial-gradient(circle, ${T.teal}CC, ${T.violet}CC)` : `linear-gradient(135deg, ${T.violet}, ${T.teal})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 30, fontWeight: 800, color: "#0A0A0F", boxShadow: glowing ? `0 0 0 6px ${T.teal}44, 0 0 0 12px ${T.teal}22, 0 16px 48px ${T.teal}66` : `0 8px 32px ${T.violet}44`, transition: "all 0.4s", letterSpacing: 1, fontFamily: T.fontFamily }}>
          {initials}
        </div>
        <div style={{ position: "absolute", bottom: 2, right: 2, width: 24, height: 24, borderRadius: 9999, background: T.elevated, border: `1.5px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="camera" size={12} color={T.textDim} />
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: -0.5 }}>{profile?.full_name || profile?.username || "Loadout User"}</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginTop: 3 }}>{profile?.email || ""}</div>
      </div>

      <div style={{ display: "flex", gap: 6, width: "100%" }}>
        {[
          { label: "Height", value: profile?.height_cm ? `${profile.height_cm}cm` : "—", icon: "trend-up", color: T.teal },
          { label: "Weight", value: profile?.current_weight_kg ? `${profile.current_weight_kg}kg` : "—", icon: "dumbbell", color: T.amber },
          { label: "Target", value: profile?.target_weight_kg ? `${profile.target_weight_kg}kg` : "—", icon: "bolt", color: T.violet },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 0", textAlign: "center" }}>
            <Icon name={icon} size={15} color={color} />
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: T.fontMono, color: T.text, marginTop: 4 }}>{value}</div>
            <div style={{ fontSize: 9, color: T.textDim, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {glowing && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `${T.teal}18`, border: `1px solid ${T.teal}44`, borderRadius: 12, width: "100%" }}>
          <Mascot glowing={glowing} />
          <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5, flex: 1 }}>
            Hey! I'm <b style={{ color: T.teal }}>Loadie</b> — I live inside your data. Keep crushing it!
          </div>
        </div>
      )}
    </div>
  );
}

// ── Editable section wrapper ─────────────────────────────────────────────────
function SGroup({ title, children, editing, onEdit, onSave, onCancel, saving }) {
  return (
    <div style={{ padding: "0 20px 14px" }}>
      <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: 600, marginBottom: 8, paddingLeft: 4, display: "flex", alignItems: "center", gap: 8 }}>
        {title}
        <div style={{ flex: 1 }} />
        {editing ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onCancel} style={{ fontSize: 12, color: T.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={onSave} disabled={saving} style={{ fontSize: 12, color: T.teal, fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.5 : 1 }}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : onEdit ? (
          <button onClick={onEdit} style={{ fontSize: 11, color: T.teal, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>Edit</button>
        ) : null}
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function SRow({ label, value, last, danger, children }) {
  return (
    <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: last ? "none" : `0.5px solid ${T.border}` }}>
      <span style={{ fontSize: 13, color: danger ? T.negative : T.text, fontWeight: 500, flex: 1 }}>{label}</span>
      {children || (value && (
        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: /\d/.test(String(value)) ? T.fontMono : T.fontFamily }}>{value}</span>
      ))}
    </div>
  );
}

function FieldInput({ label, value, onChange, type = "text", unit, last }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ padding: "10px 14px", borderBottom: last ? "none" : `0.5px solid ${T.border}` }}>
      <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 }}>
        {label}{unit && <span style={{ color: T.textDim }}> · {unit}</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", background: T.elevated, border: `1px solid ${focused ? T.teal : T.border}`,
          borderRadius: 8, padding: "8px 10px", fontSize: 14, color: T.text,
          outline: "none", fontFamily: type === "number" ? T.fontMono : "inherit",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options, last }) {
  return (
    <div style={{ padding: "10px 14px", borderBottom: last ? "none" : `0.5px solid ${T.border}` }}>
      <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            style={{ padding: "5px 12px", borderRadius: 8, background: value === opt.value ? T.teal : T.elevated, color: value === opt.value ? "#0A0A0F" : T.text, border: `1px solid ${value === opt.value ? T.teal : T.border}`, fontSize: 12, fontWeight: value === opt.value ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FullProfilePage({ profile, onClose, onLogout, onProfileUpdate }) {
  const [saving, setSaving] = useState(false);
  const [avatarTaps, setAvatarTaps] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const tapTimer = useRef(null);

  // Display name editing
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");

  // Body metrics editing
  const [editingBody, setEditingBody] = useState(false);
  const [bWeight, setBWeight] = useState(String(profile?.current_weight_kg || ""));
  const [bGoal, setBGoal] = useState(String(profile?.target_weight_kg || ""));
  const [bHeight, setBHeight] = useState(String(profile?.height_cm || ""));
  const [bAge, setBAge] = useState(String(profile?.age || ""));
  const [bSex, setBSex] = useState(profile?.gender || "");

  // Nutrition targets editing
  const [editingNutrition, setEditingNutrition] = useState(false);
  const [nCal, setNCal] = useState(String(profile?.daily_calorie_target || ""));
  const [nProt, setNProt] = useState(String(profile?.daily_protein_target || ""));
  const [nCarb, setNCarb] = useState(String(profile?.daily_carb_target || ""));
  const [nFat, setNFat] = useState(String(profile?.daily_fat_target || ""));

  function onAvatarTap() {
    setAvatarTaps(t => {
      const next = t + 1;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = setTimeout(() => setAvatarTaps(0), 1200);
      if (next >= 5) { setGlowing(true); setTimeout(() => setGlowing(false), 5000); return 0; }
      return next;
    });
  }

  async function saveName() {
    setSaving(true);
    try { const u = await userAPI.updateProfile({ full_name: fullName }); onProfileUpdate?.(u); } catch {}
    setSaving(false); setEditingName(false);
  }

  async function saveBody() {
    setSaving(true);
    try {
      await userAPI.updateProfile({
        current_weight_kg: parseFloat(bWeight) || undefined,
        target_weight_kg: parseFloat(bGoal) || undefined,
        height_cm: parseFloat(bHeight) || undefined,
        age: parseInt(bAge) || undefined,
        gender: bSex || undefined,
      });
      onProfileUpdate?.({ ...profile, current_weight_kg: parseFloat(bWeight), target_weight_kg: parseFloat(bGoal), height_cm: parseFloat(bHeight), age: parseInt(bAge), gender: bSex });
    } catch {}
    setSaving(false); setEditingBody(false);
  }

  async function saveNutrition() {
    setSaving(true);
    try {
      await userAPI.updateProfile({
        daily_calorie_target: parseInt(nCal) || undefined,
        daily_protein_target: parseInt(nProt) || undefined,
        daily_carb_target: parseInt(nCarb) || undefined,
        daily_fat_target: parseInt(nFat) || undefined,
      });
      onProfileUpdate?.({ ...profile, daily_calorie_target: parseInt(nCal), daily_protein_target: parseInt(nProt), daily_carb_target: parseInt(nCarb), daily_fat_target: parseInt(nFat) });
    } catch {}
    setSaving(false); setEditingNutrition(false);
  }

  function cancelBody() {
    setBWeight(String(profile?.current_weight_kg || ""));
    setBGoal(String(profile?.target_weight_kg || ""));
    setBHeight(String(profile?.height_cm || ""));
    setBAge(String(profile?.age || ""));
    setBSex(profile?.gender || "");
    setEditingBody(false);
  }

  function cancelNutrition() {
    setNCal(String(profile?.daily_calorie_target || ""));
    setNProt(String(profile?.daily_protein_target || ""));
    setNCarb(String(profile?.daily_carb_target || ""));
    setNFat(String(profile?.daily_fat_target || ""));
    setEditingNutrition(false);
  }

  const inputStyle = { flex: 1, background: T.elevated2, border: `1px solid ${T.teal}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, color: T.text, outline: "none", fontFamily: T.fontFamily };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: T.bg, display: "flex", flexDirection: "column", fontFamily: T.fontFamily }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 16px 8px", borderBottom: `0.5px solid ${T.border}`, flexShrink: 0 }}>
        <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9999, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Icon name="chev-left" size={16} />
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 600, color: T.text }}>Profile</div>
        <div style={{ width: 34 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 40 }}>
        <AvatarHero profile={profile} onAvatarTap={onAvatarTap} glowing={glowing} />

        {/* Identity */}
        <SGroup title="Identity">
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
          <SRow label="Username" value={profile?.username || "—"} />
          <SRow label="Email" value={profile?.email || "—"} last />
        </SGroup>

        {/* Body Metrics */}
        <SGroup title="Body Metrics" editing={editingBody} onEdit={() => setEditingBody(true)} onSave={saveBody} onCancel={cancelBody} saving={saving}>
          {editingBody ? (
            <>
              <FieldInput label="Current weight" unit="kg" type="number" value={bWeight} onChange={setBWeight} />
              <FieldInput label="Goal weight" unit="kg" type="number" value={bGoal} onChange={setBGoal} />
              <FieldInput label="Height" unit="cm" type="number" value={bHeight} onChange={setBHeight} />
              <FieldInput label="Age" type="number" value={bAge} onChange={setBAge} />
              <SelectInput label="Biological sex" value={bSex} onChange={setBSex} last options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "non_binary", label: "Non-binary" },
                { value: "prefer_not_to_say", label: "Prefer not to say" },
              ]} />
            </>
          ) : (
            <>
              <SRow label="Current weight" value={profile?.current_weight_kg ? `${profile.current_weight_kg} kg` : "—"} />
              <SRow label="Goal weight" value={profile?.target_weight_kg ? `${profile.target_weight_kg} kg` : "—"} />
              <SRow label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : "—"} />
              <SRow label="Age" value={profile?.age ? `${profile.age} years` : "—"} />
              <SRow label="Biological sex" value={profile?.gender ? profile.gender.replace("_", " ") : "—"} last />
            </>
          )}
        </SGroup>

        {/* Nutrition Targets */}
        <SGroup title="Nutrition Targets" editing={editingNutrition} onEdit={() => setEditingNutrition(true)} onSave={saveNutrition} onCancel={cancelNutrition} saving={saving}>
          {editingNutrition ? (
            <>
              <FieldInput label="Daily Calories" unit="kcal" type="number" value={nCal} onChange={setNCal} />
              <FieldInput label="Protein" unit="g" type="number" value={nProt} onChange={setNProt} />
              <FieldInput label="Carbohydrates" unit="g" type="number" value={nCarb} onChange={setNCarb} />
              <FieldInput label="Fat" unit="g" type="number" value={nFat} onChange={setNFat} last />
            </>
          ) : (
            <>
              <SRow label="Daily Calories" value={profile?.daily_calorie_target ? `${profile.daily_calorie_target} kcal` : "—"} />
              <SRow label="Protein" value={profile?.daily_protein_target ? `${profile.daily_protein_target} g` : "—"} />
              <SRow label="Carbohydrates" value={profile?.daily_carb_target ? `${profile.daily_carb_target} g` : "—"} />
              <SRow label="Fat" value={profile?.daily_fat_target ? `${profile.daily_fat_target} g` : "—"} last />
            </>
          )}
        </SGroup>

        {/* Supplements */}
        <SGroup title="Supplements">
          {((profile?.supplements?.length ? profile.supplements : [
            { name: "Whey Protein", dose: "30g" },
            { name: "Creatine", dose: "5g" },
            { name: "Omega-3", dose: "2 caps" },
            { name: "Vitamin D3", dose: "2000 IU" },
            { name: "Magnesium", dose: "400mg" },
          ])).map((s, i, arr) => (
            <div key={s.name} style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < arr.length - 1 ? `0.5px solid ${T.border}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.fontMono, marginTop: 2 }}>
                  {s.dose}{s.times?.length ? ` · ${s.times.join(", ")}` : ""}
                </div>
              </div>
              <Toggle on={true} onChange={() => {}} />
            </div>
          ))}
        </SGroup>

        {/* Training preferences */}
        <SGroup title="Training">
          <SRow label="Primary sport" value="CrossFit" />
          <SRow label="Weekly target" value="5 sessions" />
          <SRow label="Default duration" value="60 min" />
          <SRow label="Rest day" value="Sunday" last />
        </SGroup>

        {/* Budget */}
        <SGroup title="Budget">
          <SRow label="Currency" value={profile?.preferred_currency || "CHF"} last />
        </SGroup>

        {/* About */}
        <SGroup title="About">
          <SRow label="Version" value="v2.4.0" />
          <SRow label="Build" value="20260425" last />
        </SGroup>

        {/* Sign out */}
        <div style={{ padding: "4px 20px 32px" }}>
          <button onClick={onLogout} style={{ width: "100%", padding: "14px 0", background: `${T.negative}18`, border: `1px solid ${T.negative}44`, borderRadius: 14, color: T.negative, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
        </div>

        <div style={{ textAlign: "center", fontSize: 11, color: T.textDim, paddingBottom: 20, fontFamily: T.fontMono }}>
          Loadedout · v2.4.0 · Made with <span style={{ color: T.teal }}>♥</span>
        </div>
      </div>
    </div>
  );
}
