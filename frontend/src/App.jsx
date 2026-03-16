import { useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { Calendar, UtensilsCrossed, BarChart3, MessageCircle, Dumbbell, Wallet, Package } from "lucide-react";
import { isLoggedIn, clearToken } from "./utils/api";
import SchedulePage from "./pages/SchedulePage";
import MealsPage from "./pages/MealsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";
import CalendarPage from "./pages/CalendarPage";
import WorkoutPage from "./pages/WorkoutPage";
import BudgetPage from "./pages/BudgetPage";
import LoginPage from "./pages/LoginPage";
import InventoryPage from "./pages/InventoryPage";

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

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-bg pb-20 safe-top">
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
      </Routes>

      <nav className="fixed bottom-0 left-0 right-0 bg-bg border-t border-slate-800 safe-bottom z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto overflow-x-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
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
