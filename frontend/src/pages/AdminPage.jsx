import { useEffect, useState } from "react";
import {
  Activity,
  RefreshCw,
  Search,
  Shield,
  UserPlus,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { adminAPI } from "../utils/api";

const ROLE_OPTIONS = ["user", "admin"];

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-bg-card border border-slate-800 rounded-xl p-3">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
        <Icon size={13} />
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold text-slate-100">{value}</div>
    </div>
  );
}

export default function AdminPage({ currentUser }) {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [creating, setCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    is_active: true,
  });

  async function loadAll(search = "") {
    setError("");
    try {
      const [overviewData, usersData] = await Promise.all([
        adminAPI.getOverview(),
        adminAPI.getUsers(search),
      ]);
      setOverview(overviewData);
      setUsers(usersData.users || []);
    } catch (e) {
      setError(e.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await adminAPI.createUser(newUser);
      setNewUser({ username: "", email: "", password: "", role: "user", is_active: true });
      await loadAll(query.trim());
    } catch (e) {
      setError(e.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function patchUser(id, patch) {
    setWorkingId(id);
    setError("");
    try {
      const updated = await adminAPI.updateUser(id, patch);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      const stats = await adminAPI.getOverview();
      setOverview(stats);
    } catch (e) {
      setError(e.message || "Failed to update user");
    } finally {
      setWorkingId(null);
    }
  }

  function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  }

  async function handlePasswordReset(user) {
    const password = window.prompt(`Set new password for ${user.username} (min 8 chars):`, "");
    if (!password) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    await patchUser(user.id, { password });
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-5xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield size={18} className="text-violet-400" />
            Admin Control Panel
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Signed in as {currentUser?.username || "admin"} ({currentUser?.role || "admin"})
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            loadAll(query.trim());
          }}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {error && <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg p-2.5">{error}</p>}

      {loading ? (
        <div className="text-sm text-slate-500 py-10 text-center">Loading admin data...</div>
      ) : (
        <>
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatCard icon={Users} label="Total users" value={overview.total_users} />
              <StatCard icon={Shield} label="Admins" value={overview.admin_users} />
              <StatCard icon={Activity} label="Workouts (7d)" value={overview.workouts_7d} />
              <StatCard icon={UtensilsCrossed} label="Meals today" value={overview.meals_today} />
              <StatCard icon={UserPlus} label="New users (7d)" value={overview.new_users_7d} />
              <StatCard icon={Users} label="Active users" value={overview.active_users} />
              <StatCard icon={Wallet} label="Expenses (30d)" value={`CHF ${overview.expenses_30d.toFixed(2)}`} />
            </div>
          )}

          <form onSubmit={handleCreateUser} className="bg-bg-card border border-slate-800 rounded-xl p-3 space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">Create User</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <input
                value={newUser.username}
                onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                placeholder="username"
                className="bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-violet-500 focus:outline-none"
              />
              <input
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                placeholder="email"
                className="bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-violet-500 focus:outline-none"
              />
              <input
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                placeholder="password"
                type="password"
                className="bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-violet-500 focus:outline-none"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                className="bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-violet-500 focus:outline-none"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={creating || !newUser.username || !newUser.email || !newUser.password}
                className="bg-violet-600/20 text-violet-300 rounded-lg px-3 py-2 text-sm font-medium hover:bg-violet-600/30 disabled:opacity-40"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>

          <div className="bg-bg-card border border-slate-800 rounded-xl p-3 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by username or email"
                  className="w-full bg-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-200 border border-slate-700 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setLoading(true);
                  loadAll(query.trim());
                }}
                className="px-3 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Search
              </button>
            </div>

            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{u.username}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      <p className="text-[11px] text-slate-500 mt-1">Joined: {formatDate(u.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <select
                        value={u.role || "user"}
                        disabled={workingId === u.id}
                        onChange={(e) => patchUser(u.id, { role: e.target.value })}
                        className="bg-slate-900 rounded px-2 py-1 text-xs text-slate-200 border border-slate-700 focus:outline-none"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        disabled={workingId === u.id}
                        onClick={() => patchUser(u.id, { is_active: !u.is_active })}
                        className={`text-xs px-2 py-1 rounded ${
                          u.is_active
                            ? "bg-emerald-900/30 text-emerald-300"
                            : "bg-red-900/30 text-red-300"
                        }`}
                      >
                        {u.is_active ? "Active" : "Disabled"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      disabled={workingId === u.id}
                      onClick={() => handlePasswordReset(u)}
                      className="text-xs px-2.5 py-1.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-5">No users found.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

