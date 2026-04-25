import { useState } from "react";
import { authAPI, getGoogleOAuthOrigin, isNativePlatform, runGoogleAuthFlow, setToken } from "../utils/api";
import { T } from "../design/tokens";
import { Icon } from "../design/icons";

const inputStyle = {
  width: "100%",
  background: T.elevated,
  borderRadius: T.rInput,
  padding: "12px 14px",
  fontSize: 14,
  border: `1px solid ${T.border}`,
  color: T.text,
  outline: "none",
  fontFamily: T.fontFamily,
  transition: "border-color 0.15s",
};

export default function LoginPage({ onLogin }) {
  const [mode, setMode]                 = useState("signin");
  const [username, setUsername]         = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirm]   = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        const data = await authAPI.register(username, email, password);
        setToken(data.access_token, data.refresh_token);
        onLogin();
      } else {
        const data = await authAPI.login(username, password);
        setToken(data.access_token, data.refresh_token);
        onLogin();
      }
    } catch (err) {
      setError(err.message || (mode === "signup" ? "Signup failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError("");
    setGoogleLoading(true);
    try {
      const native = isNativePlatform();
      const googleMode = mode === "signup" ? "signup" : "login";
      const { auth_url } = await authAPI.getGoogleLoginUrl(getGoogleOAuthOrigin(), native, googleMode);
      const payload = await runGoogleAuthFlow(auth_url, googleMode);
      if (!payload.access_token || !payload.refresh_token) throw new Error("Google auth did not return tokens");
      setToken(payload.access_token, payload.refresh_token);
      onLogin();
    } catch (err) {
      setError(err.message || "Google authentication failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: T.fontFamily,
      }}
    >
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${T.violet}, ${T.teal})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: `0 16px 48px ${T.teal}33`,
            }}
          >
            <Icon name="bolt" size={28} color="#0A0A0F" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: -0.5, marginBottom: 6 }}>
            Loadedout
          </h1>
          <p style={{ fontSize: 13, color: T.textMuted }}>Your personal lifestyle OS</p>
        </div>

        {/* Card */}
        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            padding: 24,
          }}
        >
          {/* Mode toggle */}
          <div
            style={{
              display: "flex",
              background: T.elevated,
              borderRadius: 12,
              padding: 3,
              marginBottom: 20,
            }}
          >
            {["signin", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 10,
                  border: "none",
                  background: mode === m ? T.elevated2 : "transparent",
                  color: mode === m ? T.text : T.textMuted,
                  fontSize: 13,
                  fontWeight: mode === m ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: T.fontFamily,
                  transition: "all 0.15s",
                }}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Username */}
            <div>
              <label style={{ fontSize: 12, color: T.textMuted, display: "block", marginBottom: 6, fontWeight: 500 }}>
                {mode === "signin" ? "Username or Email" : "Username"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === "signin" ? "username or email" : "choose a username"}
                autoComplete="username"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = T.teal)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
            </div>

            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 12, color: T.textMuted, display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = T.teal)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: T.textMuted, display: "block", marginBottom: 6, fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = T.teal)}
                onBlur={(e) => (e.target.style.borderColor = T.border)}
              />
            </div>

            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 12, color: T.textMuted, display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = T.teal)}
                  onBlur={(e) => (e.target.style.borderColor = T.border)}
                />
              </div>
            )}

            {error && (
              <div
                style={{
                  fontSize: 12,
                  color: T.negative,
                  textAlign: "center",
                  padding: "8px 12px",
                  background: `${T.negative}18`,
                  borderRadius: 8,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                (mode === "signup"
                  ? !username || !email || !password || !confirmPassword
                  : !username || !password)
              }
              style={{
                width: "100%",
                padding: "14px 0",
                background: T.teal,
                color: "#0A0A0F",
                border: "none",
                borderRadius: T.rInput,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: T.fontFamily,
                letterSpacing: 0.1,
                opacity: loading ? 0.6 : 1,
                boxShadow: `0 8px 24px ${T.teal}44`,
                transition: "opacity 0.15s",
              }}
            >
              {loading
                ? mode === "signup" ? "Creating account…" : "Signing in…"
                : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 11, color: T.textDim }}>or</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading}
              style={{
                width: "100%",
                padding: "12px 0",
                background: T.elevated,
                color: T.text,
                border: `1px solid ${T.border}`,
                borderRadius: T.rInput,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: T.fontFamily,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: googleLoading ? 0.6 : 1,
              }}
            >
              <Icon name="google" size={16} color={T.text} />
              {googleLoading ? "Opening Google…" : "Continue with Google"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: T.textDim, marginTop: 20, fontFamily: T.fontMono }}>
          Loadedout · v2.4.0
        </p>
      </div>
    </div>
  );
}
