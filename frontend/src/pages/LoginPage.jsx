import { useState } from "react";
import { Sparkles } from "lucide-react";
import { authAPI, setToken } from "../utils/api";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authAPI.login(username, password);
      setToken(data.access_token, data.refresh_token);
      onLogin();
    } catch (err) {
      setError(err.message || "Login failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={28} className="text-accent-green" />
            <h1 className="text-2xl font-bold text-white">LifePlan</h1>
          </div>
          <p className="text-slate-500 text-sm">Your personal routine & nutrition assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card rounded-2xl p-6 space-y-4 border border-slate-800">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="sal"
              autoComplete="username"
              className="w-full bg-slate-800/60 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:border-accent-green focus:outline-none text-white"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-slate-800/60 rounded-xl px-4 py-3 text-sm border border-slate-700 focus:border-accent-green focus:outline-none text-white"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3 bg-accent-green/20 text-accent-green rounded-xl text-sm font-medium hover:bg-accent-green/30 transition-colors disabled:opacity-40"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
