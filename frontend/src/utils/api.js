// I handle all API communication with the FastAPI backend
const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

function getToken() {
  return localStorage.getItem("lifeplan_token");
}

export function setToken(access, refresh) {
  localStorage.setItem("lifeplan_token", access);
  localStorage.setItem("lifeplan_refresh_token", refresh);
}

export function clearToken() {
  localStorage.removeItem("lifeplan_token");
  localStorage.removeItem("lifeplan_refresh_token");
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      window.location.reload();
    }
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const authAPI = {
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  refresh: (refresh_token) =>
    request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),
};

export const scheduleAPI = {
  getAll: (day) => request(`/schedule/${day !== undefined ? `?day=${day}` : ""}`),
  create: (data) => request("/schedule/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/schedule/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/schedule/${id}`, { method: "DELETE" }),
};

export const mealsAPI = {
  getTemplates: (type) => request(`/meals/templates${type ? `?meal_type=${type}` : ""}`),
  saveTemplate: (data) => request("/meals/templates", { method: "POST", body: JSON.stringify(data) }),
  updateTemplate: (id, data) => request(`/meals/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTemplate: (id) => request(`/meals/templates/${id}`, { method: "DELETE" }),
  logMeal: (data) => request("/meals/log", { method: "POST", body: JSON.stringify(data) }),
  deleteLog: (id) => request(`/meals/log/${id}`, { method: "DELETE" }),
  logManual: (data) => request("/meals/log-manual", { method: "POST", body: JSON.stringify(data) }),
  getToday: () => request("/meals/today"),
  getHistory: (days) => request(`/meals/history?days=${days || 7}`),
};

export const analyticsAPI = {
  logWeight: (data) => request("/analytics/weight", { method: "POST", body: JSON.stringify(data) }),
  getWeights: (days) => request(`/analytics/weight?days=${days || 30}`),
  getDashboard: () => request("/analytics/dashboard"),
};

export const workoutAPI = {
  analyze: (data) => request("/workout/analyze", { method: "POST", body: JSON.stringify(data) }),
  save: (data) => request("/workout/", { method: "POST", body: JSON.stringify(data) }),
  getAll: (days) => request(`/workout/?days=${days || 30}`),
  getStats: () => request("/workout/stats"),
  delete: (id) => request(`/workout/${id}`, { method: "DELETE" }),
  getTemplates: () => request("/workout/templates"),
  saveTemplate: (data) => request("/workout/templates", { method: "POST", body: JSON.stringify(data) }),
  updateTemplate: (id, data) => request(`/workout/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTemplate: (id) => request(`/workout/templates/${id}`, { method: "DELETE" }),
};

export const budgetAPI = {
  add: (data) => request("/budget/", { method: "POST", body: JSON.stringify(data) }),
  getAll: (period) => request(`/budget/?period=${period || "week"}`),
  getSummary: () => request("/budget/summary"),
  delete: (id) => request(`/budget/${id}`, { method: "DELETE" }),
};

export const aiAPI = {
  chat: (message, history, contextType) =>
    request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversation_history: history, context_type: contextType }),
    }),
  swapMeal: (mealId, reason, preferences) =>
    request("/ai/swap-meal", {
      method: "POST",
      body: JSON.stringify({ current_meal_id: mealId, reason, preferences }),
    }),
  estimateMacros: (description) =>
    request(`/ai/estimate-macros?description=${encodeURIComponent(description)}`, { method: "POST" }),
};

export const userAPI = {
  getProfile: () => request("/user/profile"),
  updateProfile: (data) => request("/user/profile", { method: "PUT", body: JSON.stringify(data) }),
};

export const chatAPI = {
  getSessions: () => request("/chat/sessions"),
  getSession: (id) => request(`/chat/sessions/${id}`),
  saveSession: (messages, title) => request("/chat/sessions", { method: "POST", body: JSON.stringify({ messages, title }) }),
  deleteSession: (id) => request(`/chat/sessions/${id}`, { method: "DELETE" }),
};


export const inventoryAPI = {
  getAll: () => request("/inventory/"),
  add: (data) => request("/inventory/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/inventory/${id}`, { method: "DELETE" }),
};
