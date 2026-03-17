import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { Calendar, UtensilsCrossed, BarChart3, MessageCircle, Dumbbell, Wallet, Package, Shield, LogOut } from "lucide-react";
import { isLoggedIn, clearToken, userAPI } from "./utils/api";
import SchedulePage from "./pages/SchedulePage";
import MealsPage from "./pages/MealsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";
import CalendarPage from "./pages/CalendarPage";
import WorkoutPage from "./pages/WorkoutPage";
import BudgetPage from "./pages/BudgetPage";
import LoginPage from "./pages/LoginPage";
import InventoryPage from "./pages/InventoryPage";
import AdminPage from "./pages/AdminPage";

const NAV_ITEMS = [
  { path: "/schedule", icon: Calendar, label: "Schedule" },
  { path: "/meals", icon: UtensilsCrossed, label: "Meals" },
  { path: "/workout", icon: Dumbbell, label: "Workout" },
  { path: "/budget", icon: Wallet, label: "Budget" },
  { path: "/inventory", icon: Package, label: "Pantry" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/chat", icon: MessageCircle, label: "Chat" },
];

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(!!isLoggedIn());

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!loggedIn) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      try {
        const p = await userAPI.getProfile();
        if (!cancelled) setProfile(p);
      } catch {
        clearToken();
        if (!cancelled) {
          setProfile(null);
          setLoggedIn(false);
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, [loggedIn]);

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-slate-400 text-sm">
        Loading profile...
      </div>
    );
  }

  const isAdmin = (profile?.role || "user") === "admin";
  const navItems = isAdmin
    ? [...NAV_ITEMS, { path: "/admin", icon: Shield, label: "Admin" }]
    : NAV_ITEMS;

  function handleLogout() {
    clearToken();
    setProfile(null);
    setLoggedIn(false);
  }

  return (
    <div className="min-h-screen bg-bg pb-20 safe-top">
      <button
        onClick={handleLogout}
        className="fixed top-3 right-3 z-50 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-300 hover:text-white"
      >
        <LogOut size={12} />
        Logout
      </button>
      <Routes>
        <Route path="/" element={<Navigate to="/schedule" replace />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/meals" element={<MealsPage />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route
          path="/admin"
          element={isAdmin ? <AdminPage currentUser={profile} /> : <Navigate to="/schedule" replace />}
        />
      </Routes>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg border-t border-slate-800 safe-bottom z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto overflow-x-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-colors flex-shrink-0 ${
                  isActive ? "text-accent-green" : "text-slate-500"
                }`
              }
            >
              <Icon size={18} />
              <span className="text-[9px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
