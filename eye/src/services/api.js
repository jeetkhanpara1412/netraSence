/**
 * Centralized API Client Interface
 * Handles communication with the FastAPI/PostgreSQL backend.
 * Reports backend failures to callers; only explicit demo flows use local demo data.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const ACCESS_TOKEN_KEY = "retinasight_access_token";

const authHeaders = (headers = {}) => {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};

const responseError = async (response, { clearExpiredSession = true } = {}) => {
  const error = await response.json().catch(() => ({ detail: response.statusText }));
  if (response.status === 401 && clearExpiredSession) {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent("retinasight:auth-expired"));
    return new Error("Your sign-in is missing or expired. Please sign in again.");
  }
  if (response.status === 403) {
    return new Error(error.detail || "This account does not have permission for this action.");
  }
  return new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
};

const authorizedFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: authHeaders(options.headers)
  });
  if (!response.ok) throw await responseError(response);
  return response;
};

export const api = {
  baseUrl: API_BASE_URL,

  getAccessToken: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),

  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw await responseError(response, { clearExpiredSession: false });
    const result = await response.json();
    if (!["ADMIN", "CLINICIAN", "DEVELOPER"].includes(result.user?.role?.toUpperCase())) {
      throw new Error("This workflow requires a clinician, administrator, or developer account.");
    }
    sessionStorage.setItem(ACCESS_TOKEN_KEY, result.access_token);
    return result.user;
  },

  getCurrentUser: async () => {
    if (!sessionStorage.getItem(ACCESS_TOKEN_KEY)) return null;
    const response = await authorizedFetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { "Accept": "application/json" }
    });
    return response.json();
  },

  clearSession: () => sessionStorage.removeItem(ACCESS_TOKEN_KEY),

  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(2500)
      });
      if (response.ok) {
        return await response.json();
      }
      console.error(`The screening backend health check returned HTTP ${response.status}.`);
    } catch {
      console.error("The screening backend health endpoint is unavailable.");
    }
    return null;
  },

  get: async (endpoint) => {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await authorizedFetch(url, {
      headers: { "Accept": "application/json" }
    });
    return response.json();
  },

  post: async (endpoint, data) => {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    const isFormData = data instanceof FormData;
    const headers = isFormData ? {} : { "Content-Type": "application/json", "Accept": "application/json" };
    const body = isFormData ? data : JSON.stringify(data);

    const response = await authorizedFetch(url, {
      method: "POST",
      headers,
      body
    });
    return response.json();
  },

  upload: async (endpoint, formData) => {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await authorizedFetch(url, {
      method: "POST",
      body: formData
    });
    return response.json();
  }
};
