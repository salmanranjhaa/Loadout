import { useState, useEffect, useRef } from "react";
import { T } from "../../design/tokens";
import { Icon } from "../../design/icons";
import { Card, DetailHeader, PageScroll, SectionHead } from "../../design/components";

const MOCK_EXERCISES = [
  {
    name: "Bench press",
    sets: [
      { num: 1, weight: "80", reps: 10, done: true, pr: false },
      { num: 2, weight: "85", reps: 8, done: true, pr: false },
      { num: 3, weight: "92.5", reps: 6, done: true, pr: true },
      { num: 4, weight: "92.5", reps: 5, done: false, pr: false },
    ],
  },
  {
    name: "Incline DB press",
    sets: [
      { num: 1, weight: "32", reps: 12, done: true, pr: false },
      { num: 2, weight: "32", reps: 10, done: true, pr: false },
      { num: 3, weight: "34", reps: 9, done: false, pr: false },
    ],
  },
  {
    name: "Weighted dips",
    sets: [
      { num: 1, weight: "20", reps: 10, done: false, pr: false },
      { num: 2, weight: "20", reps: 10, done: false, pr: false },
    ],
  },
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatElapsed(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

export default function WorkoutLogPage({ log = {}, onBack, historyMode = false }) {
  const { name = "Push Day", date = "4/20" } = log;

  const [elapsed, setElapsed] = useState(historyMode ? 3927 : 0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (historyMode) return;
    if (paused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [historyMode, paused]);

  const [sets, setSets] = useState(MOCK_EXERCISES);

  function toggleSet(exIdx, setIdx) {
    if (historyMode) return;
    setSets((prev) =>
      prev.map((ex, ei) =>
        ei !== exIdx
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s, si) =>
                si !== setIdx ? s : { ...s, done: !s.done }
              ),
            }
      )
    );
  }

  const isLive = !historyMode;
  const subtitle = isLive ? "live" : date;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        zIndex: 10,
        animationName: "lo-slide-in",
        animationDuration: "0.25s",
        animationFillMode: "forwards",
      }}
    >
      {/* Header */}
      <DetailHeader
        onBack={onBack}
        title={`${name} · ${subtitle}`}
        trailing={
          isLive ? (
            <button
              style={{
                height: 30, padding: "0 12px",
                background: `${T.negative}22`,
                border: `1px solid ${T.negative}66`,
                borderRadius: 8,
                color: T.negative, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                letterSpacing: 0.5,
              }}
            >
              END
            </button>
          ) : (
            <button
              style={{
                width: 34, height: 34, borderRadius: 9999,
                background: T.elevated, border: `1px solid ${T.border}`,
                color: T.textMuted, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 16, letterSpacing: 1 }}>···</span>
            </button>
          )
        }
      />

      <PageScroll padBottom={isLive ? 96 : 20}>
        <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Timer/stats card */}
          <div
            style={{
              borderRadius: T.rCard,
              background: isLive
                ? `linear-gradient(135deg, ${T.tealDim}88, ${T.violetDim}cc)`
                : T.surface,
              border: isLive ? `1px solid ${T.teal}30` : `1px solid ${T.border}`,
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ flex: 1 }}>
              {isLive && (
                <div style={{
                  fontSize: 10, color: isLive ? `${T.teal}cc` : T.textMuted,
                  fontFamily: T.fontMono, letterSpacing: 1, textTransform: "uppercase",
                  marginBottom: 4,
                }}>
                  ● Live
                </div>
              )}
              <div style={{
                fontSize: 44, fontWeight: 800, fontFamily: T.fontMono,
                color: T.text, letterSpacing: -2, lineHeight: 1,
              }}>
                {formatElapsed(elapsed)}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, fontFamily: T.fontMono }}>
                {isLive ? "elapsed" : "duration"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                background: `rgba(10,10,15,0.45)`, backdropFilter: "blur(8px)",
                borderRadius: 10, padding: "8px 12px", textAlign: "center",
                border: `1px solid rgba(255,255,255,0.08)`,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.fontMono }}>3,840</div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>vol kg</div>
              </div>
              <div style={{
                background: `rgba(10,10,15,0.45)`, backdropFilter: "blur(8px)",
                borderRadius: 10, padding: "8px 12px", textAlign: "center",
                border: `1px solid rgba(255,255,255,0.08)`,
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: isLive ? T.negative : T.text, fontFamily: T.fontMono }}>142</div>
                <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>HR bpm</div>
              </div>
            </div>
          </div>

          {/* Exercise groups */}
          {sets.map((ex, exIdx) => (
            <div key={exIdx}>
              <SectionHead title={ex.name} />
              {/* Horizontal scrollable set cards */}
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {ex.sets.map((s, si) => (
                  <div
                    key={si}
                    onClick={() => toggleSet(exIdx, si)}
                    style={{
                      flexShrink: 0,
                      width: 86,
                      background: s.done ? `${T.teal}18` : T.surface,
                      border: `1px solid ${s.done ? T.teal + "60" : T.border}`,
                      borderRadius: 13,
                      padding: "10px 10px 10px 10px",
                      cursor: isLive ? "pointer" : "default",
                      position: "relative",
                    }}
                  >
                    {/* Checkbox top-left */}
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      width: 16, height: 16, borderRadius: 5,
                      background: s.done ? T.teal : T.elevated2,
                      border: s.done ? "none" : `1px solid ${T.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {s.done && <Icon name="check" size={10} color="#0A0A0F" strokeWidth={2.5} />}
                    </div>

                    {/* PR star badge */}
                    {s.pr && (
                      <div style={{
                        position: "absolute", top: 6, right: 6,
                        fontSize: 9, color: T.amber, fontWeight: 700,
                      }}>★</div>
                    )}

                    <div style={{ marginTop: 18, textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: T.textMuted, fontFamily: T.fontMono, letterSpacing: 0.5 }}>
                        SET {s.num}
                      </div>
                      <div style={{
                        fontSize: 18, fontWeight: 800, color: T.text,
                        fontFamily: T.fontMono, lineHeight: 1.1, marginTop: 4,
                      }}>
                        {s.weight}
                      </div>
                      <div style={{ fontSize: 9, color: T.textMuted, fontFamily: T.fontMono, marginTop: 1 }}>
                        kg
                      </div>
                      <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.fontMono, marginTop: 3 }}>
                        × {s.reps}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add-set dashed card (live only) */}
                {isLive && (
                  <div style={{
                    flexShrink: 0, width: 86, height: "auto", minHeight: 98,
                    background: "transparent",
                    border: `1.5px dashed ${T.border}`,
                    borderRadius: 13,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    color: T.textDim,
                  }}>
                    <Icon name="plus" size={18} color={T.textDim} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add exercise dashed button (live only) */}
          {isLive && (
            <button
              style={{
                width: "100%", padding: "12px",
                background: "transparent",
                border: `1.5px dashed ${T.border}`,
                borderRadius: T.rCard,
                color: T.textMuted, fontSize: 13, fontWeight: 500,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6, fontFamily: "inherit",
              }}
            >
              <Icon name="plus" size={16} color={T.textMuted} />
              Add exercise
            </button>
          )}

          {/* AI Analysis card (history only) */}
          {!isLive && (
            <div>
              <SectionHead title="AI Analysis" />
              <Card style={{
                background: `linear-gradient(135deg, ${T.violetDim}55, ${T.elevated})`,
                border: `1px solid ${T.violet}40`,
                padding: 16, display: "flex", gap: 12,
              }}>
                {/* Violet circle avatar */}
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
                    Great push session! You hit a new PR on bench at 92.5 kg — that's 3 kg above your previous best.
                    Volume was up 6.2% from last week. Recovery time between sets was slightly longer; consider tightening
                    rest on cable fly to keep intensity high next time.
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </PageScroll>

      {/* Sticky bottom (live only) */}
      {isLive && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "12px 16px 28px",
          background: `linear-gradient(to top, ${T.bg} 70%, transparent)`,
          display: "flex", gap: 10, alignItems: "center",
        }}>
          <button
            onClick={() => setPaused((p) => !p)}
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
            style={{
              flex: 2, height: 46, borderRadius: 13,
              background: T.teal, border: "none",
              color: "#0A0A0F", fontSize: 15, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, fontFamily: "inherit",
            }}
          >
            <Icon name="check" size={18} color="#0A0A0F" strokeWidth={2.4} />
            Finish Session
          </button>
        </div>
      )}
    </div>
  );
}
