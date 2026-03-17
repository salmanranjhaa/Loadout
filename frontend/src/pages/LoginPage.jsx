import { useState } from "react";
import { Sparkles } from "lucide-react";
import { authAPI, runGoogleAuthPopup, setToken } from "../utils/api";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
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
      const { auth_url } = await authAPI.getGoogleLoginUrl(window.location.origin);
      const payload = await runGoogleAuthPopup(auth_url, "login");
      if (!payload.access_token || !payload.refresh_token) {
        throw new Error("Google login did not return app tokens");
      }
      setToken(payload.access_token, payload.refresh_token);
      onLogin();
    } catch (err) {
      setError(err.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={28} className="text-accent-green" />
            <h1 className="text-2xl font-bold text-white">LifePlan</h1>
          </div>
          <p className="text-slate-500 text-sm">Your personal routine and nutrition assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card rounded-2xl p-6 space-y-4 border border-slate-800">
          <div className="flex bg-slate-800/50 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === "signin" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === "signup" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign up
            </button>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              {mode === "signin" ? "Username or Email" : "Username"}
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={mode === "signin" ? "salma or salma@email.com" : "choose a username"}
              autoComplete="username"
              className="w-full bg-slate-800/60 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:border-accent-green focus:outline-none text-white"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-slate-800/60 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:border-accent-green focus:outline-none text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="********"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full bg-slate-800/60 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:border-accent-green focus:outline-none text-white"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="********"
                autoComplete="new-password"
                className="w-full bg-slate-800/60 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:border-accent-green focus:outline-none text-white"
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "signup" ? (!username || !email || !password || !confirmPassword) : (!username || !password))}
            className="w-full py-3 bg-accent-green/20 text-accent-green rounded-xl text-sm font-medium hover:bg-accent-green/30 transition-colors disabled:opacity-40"
          >
            {loading
              ? (mode === "signup" ? "Creating account..." : "Signing in...")
              : (mode === "signup" ? "Create account" : "Sign in")}
          </button>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative text-center text-[10px] text-slate-500">
              <span className="px-2 bg-bg-card">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full py-3 bg-blue-600/15 text-blue-300 rounded-xl text-sm font-medium hover:bg-blue-600/25 transition-colors disabled:opacity-40"
          >
            {googleLoading ? "Opening Google..." : "Continue with Google"}
          </button>
        </form>
      </div>
    </div>
  );
}
