import { useState } from "react";
import { T } from "./tokens";
import { Icon } from "./icons";

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, elevated = false, onClick, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: elevated ? T.elevated : T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.rCard,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Chip ────────────────────────────────────────────────────────────────────
export function Chip({ children, active, color, style = {}, onClick, size = "md" }) {
  const sizes = {
    sm: { fontSize: 11, padding: "4px 8px", height: 24 },
    md: { fontSize: 12, padding: "6px 10px", height: 28 },
    lg: { fontSize: 13, padding: "8px 14px", height: 34 },
  };
  const s = sizes[size];
  const c = color || T.teal;
  return (
    <button
      onClick={onClick}
      style={{
        height: s.height,
        padding: s.padding,
        background: active ? c : T.elevated,
        color: active ? "#0A0A0F" : T.text,
        border: active ? "none" : `1px solid ${T.border}`,
        borderRadius: T.rChip,
        fontSize: s.fontSize,
        fontWeight: active ? 600 : 500,
        letterSpacing: 0.1,
        cursor: onClick ? "pointer" : "default",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── FAB ─────────────────────────────────────────────────────────────────────
export function Fab({ onClick, icon = "plus", color, right = 20, bottom = 92 }) {
  const c = color || T.teal;
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        right,
        bottom,
        zIndex: 20,
        width: 56,
        height: 56,
        borderRadius: 9999,
        background: c,
        border: "none",
        cursor: "pointer",
        boxShadow: `0 8px 24px ${c}55, 0 0 0 1px ${c}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0A0A0F",
      }}
    >
      <Icon name={icon} size={24} strokeWidth={2.4} />
    </button>
  );
}

// ── Page header ─────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, onProfile, trailing, profile }) {
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "LO";
  return (
    <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: T.text, lineHeight: 1.1 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4, letterSpacing: 0.1 }}>
            {subtitle}
          </div>
        )}
      </div>
      {trailing}
      <button
        onClick={onProfile}
        style={{
          width: 36,
          height: 36,
          borderRadius: 9999,
          background: `linear-gradient(135deg, ${T.violet}, ${T.teal})`,
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0A0A0F",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 0.3,
          flexShrink: 0,
          fontFamily: "inherit",
        }}
      >
        {initials}
      </button>
    </div>
  );
}

// ── Back header (detail pages) ──────────────────────────────────────────────
export function DetailHeader({ onBack, title, subtitle, trailing }) {
  return (
    <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <button
        onClick={onBack}
        style={{
          width: 34,
          height: 34,
          borderRadius: 9999,
          background: T.elevated,
          border: `1px solid ${T.border}`,
          color: T.text,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Icon name="chev-left" size={16} />
      </button>
      <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text, letterSpacing: -0.1 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.fontMono, marginTop: 1 }}>{subtitle}</div>
        )}
      </div>
      {trailing || <div style={{ width: 34 }} />}
    </div>
  );
}

// ── Scrollable page body ─────────────────────────────────────────────────────
export function PageScroll({ children, padBottom = 110, style = {} }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        paddingBottom: padBottom,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Section header (within a page) ─────────────────────────────────────────
export function SectionHead({ title, trailing }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: T.textMuted,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1 }} />
      {trailing}
    </div>
  );
}

// ── Toggle ──────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange && onChange(!on)}
      style={{
        width: 34,
        height: 20,
        borderRadius: 9999,
        background: on ? T.teal : T.elevated2,
        position: "relative",
        transition: "background 0.2s",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 16 : 2,
          width: 16,
          height: 16,
          borderRadius: 9999,
          background: on ? "#0A0A0F" : T.textMuted,
          transition: "left 0.2s cubic-bezier(.34,1.56,.64,1)",
        }}
      />
    </div>
  );
}

// ── Settings row ─────────────────────────────────────────────────────────────
export function SettingsRow({ label, value, toggle, on: initialOn = false, last, onClick, danger }) {
  const [localOn, setLocalOn] = useState(!!initialOn);
  const dangerous = danger || value === "Danger";

  return (
    <div
      style={{
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderBottom: last ? "none" : `0.5px solid ${T.border}`,
        cursor: "pointer",
      }}
      onClick={() => {
        if (toggle) setLocalOn((v) => !v);
        onClick?.();
      }}
    >
      <span style={{ fontSize: 13, color: dangerous ? T.negative : T.text, fontWeight: 500, flex: 1 }}>
        {label}
      </span>
      {toggle ? (
        <Toggle on={localOn} />
      ) : value ? (
        <>
          <span
            style={{
              fontSize: 12,
              color: T.textMuted,
              fontFamily: /\d/.test(String(value)) ? T.fontMono : T.fontFamily,
            }}
          >
            {value}
          </span>
          <Icon name="chev-right" size={13} color={T.textDim} />
        </>
      ) : (
        <Icon name="chev-right" size={13} color={T.textDim} />
      )}
    </div>
  );
}

// ── Settings group ────────────────────────────────────────────────────────────
export function SettingsGroup({ title, children }) {
  return (
    <div style={{ padding: "0 20px 14px" }}>
      <div
        style={{
          fontSize: 11,
          color: T.textMuted,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Mini stat ─────────────────────────────────────────────────────────────────
export function MiniStat({ label, value }) {
  return (
    <div style={{ background: T.elevated, padding: "8px 10px", borderRadius: 10 }}>
      <div
        style={{
          fontSize: 9,
          color: T.textMuted,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: T.text,
          fontFamily: T.fontMono,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Macro bar ────────────────────────────────────────────────────────────────
export function MacroBar({ label, value, target, color, unit = "g" }) {
  const pct = Math.min(value / target, 1);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, letterSpacing: 0.3 }}>{label}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, fontFamily: T.fontMono, color: T.text, fontWeight: 500 }}>
          {value}
          <span style={{ color: T.textDim }}>
            /{target}
            {unit}
          </span>
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 9999, background: T.elevated2, overflow: "hidden" }}>
        <div style={{ width: `${pct * 100}%`, height: "100%", background: color, borderRadius: 9999 }} />
      </div>
    </div>
  );
}

// ── Macro ring ───────────────────────────────────────────────────────────────
export function MacroRing({ pct, value, target }) {
  const r = 44;
  const C = 2 * Math.PI * r;
  const dash = Math.min(pct, 1) * C;
  return (
    <div style={{ position: "relative", width: 108, height: 108, flexShrink: 0 }}>
      <svg width="108" height="108" viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={r} fill="none" stroke={T.elevated2} strokeWidth="7" />
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke={T.amber}
          strokeWidth="7"
          strokeDasharray={`${dash} ${C - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 54 54)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{ fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: -1, lineHeight: 1, fontFamily: T.fontMono }}
        >
          {value}
        </div>
        <div style={{ fontSize: 9, fontFamily: T.fontMono, color: T.textDim, marginTop: 2 }}>of {target} kcal</div>
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        gap: 12,
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: T.elevated,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: T.textDim,
          }}
        >
          <Icon name={icon} size={24} />
        </div>
      )}
      <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5 }}>{subtitle}</div>}
      {action}
    </div>
  );
}

// ── Loading spinner ──────────────────────────────────────────────────────────
export function LoadingDots() {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: 32 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 9999,
            background: T.teal,
            opacity: 0.5,
            animation: `lo-pulse 1.2s ${i * 0.2}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

