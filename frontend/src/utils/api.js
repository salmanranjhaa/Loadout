// I handle all API communication with the FastAPI backend
const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

export function getApiBase() {
  return API_BASE;
}

export function getApiOrigin() {
  try {
    return new URL(API_BASE, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

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
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    if (response.status === 401 && getToken()) {
      // Only force-logout if we had a token (session expired), not on login attempts
      clearToken();
      window.location.reload();
    }
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
  register: (username, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),
  refresh: (refresh_token) =>
    request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),
  getGoogleLoginUrl: (origin) =>
    request(`/auth/google/login-url?origin=${encodeURIComponent(origin)}`),
  getGoogleConnectUrl: (origin) =>
    request(`/auth/google/connect-url?origin=${encodeURIComponent(origin)}`),
};

export const scheduleAPI = {
  getAll: (day, targetDate) => {
    const params = new URLSearchParams();
    if (day !== undefined && day !== null) params.set("day", String(day));
    if (targetDate) params.set("target_date", targetDate);
    const query = params.toString();
    return request(`/schedule/${query ? `?${query}` : ""}`);
  },
  create: (data) => request("/schedule/", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => request(`/schedule/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => request(`/schedule/${id}`, { method: "DELETE" }),
  googleStatus: () => request("/schedule/google/status"),
  googleSync: (daysBack = 1, daysAhead = 30) =>
    request("/schedule/google/sync", {
      method: "POST",
      body: JSON.stringify({ days_back: daysBack, days_ahead: daysAhead }),
    }),
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

export const adminAPI = {
  getOverview: () => request("/admin/overview"),
  getUsers: (q = "", limit = 200) =>
    request(`/admin/users?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}`),
  createUser: (data) => request("/admin/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};


export function runGoogleAuthPopup(authUrl, expectedMode, timeoutMs = 120000) {
  const popup = window.open(authUrl, "lifeplan_google_auth", "width=520,height=700");
  if (!popup) {
    return Promise.reject(new Error("Popup blocked. Please allow popups and try again."));
  }

  const backendOrigin = getApiOrigin();
  const allowedOrigins = new Set([backendOrigin, window.location.origin]);
  try {
    const authUrlObj = new URL(authUrl);
    const redirectUri = authUrlObj.searchParams.get("redirect_uri");
    if (redirectUri) allowedOrigins.add(new URL(redirectUri).origin);
  } catch {
    // Ignore parse issues and keep fallback origins only.
  }
  // Allow www/non-www variants to avoid popup-origin mismatch when one domain is canonical.
  for (const origin of Array.from(allowedOrigins)) {
    try {
      const u = new URL(origin);
      const altHost = u.hostname.startsWith("www.") ? u.hostname.slice(4) : `www.${u.hostname}`;
      allowedOrigins.add(`${u.protocol}//${altHost}${u.port ? `:${u.port}` : ""}`);
    } catch {
      // Ignore malformed origins.
    }
  }

  return new Promise((resolve, reject) => {
    let done = false;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(closePoll);
      clearTimeout(timeout);
      if (!popup.closed) popup.close();
    };
    const finish = (fn, value) => {
      if (done) return;
      done = true;
      cleanup();
      fn(value);
    };
    const onMessage = (event) => {
      if (!allowedOrigins.has(event.origin)) return;
      if (!event.data || event.data.type !== "lifeplan_google_auth") return;
      const payload = event.data.payload || {};
      if (expectedMode && payload.mode !== expectedMode) return;
      if (payload.status === "success") {
        finish(resolve, payload);
      } else {
        finish(reject, new Error(payload.error || "Google authentication failed"));
      }
    };

    const closePoll = setInterval(() => {
      if (popup.closed) {
        finish(reject, new Error("Google authentication window was closed"));
      }
    }, 500);
    const timeout = setTimeout(() => {
      finish(reject, new Error("Google authentication timed out"));
    }, timeoutMs);

    window.addEventListener("message", onMessage);
  });
}
