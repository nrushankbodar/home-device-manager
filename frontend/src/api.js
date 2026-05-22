const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const FALLBACK_API_URL = API_URL.includes("localhost")
  ? API_URL.replace("localhost", "127.0.0.1")
  : null;

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  const requestOptions = {
    ...options,
    headers,
  };

  try {
    response = await fetch(`${API_URL}${path}`, requestOptions);
  } catch {
    if (!FALLBACK_API_URL) {
      throw new Error(`Backend is not reachable at ${API_URL}. Start FastAPI and try again.`);
    }

    try {
      response = await fetch(`${FALLBACK_API_URL}${path}`, requestOptions);
    } catch {
      throw new Error(`Backend is not reachable at ${API_URL}. Start FastAPI and try again.`);
    }
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Something went wrong");
  }

  return data;
}
