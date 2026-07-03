import { API_CONFIG, createApiClient, createServiceError } from "./api.js";

const api = createApiClient(API_CONFIG.authUrl);

export async function loginRequest({ username, password }) {
  if (!username || !password) {
    throw createServiceError("Ingrese usuario y contraseña.");
  }

  const { data } = await api.post("/auth/login", { username, password });
  return data;
}

export async function logoutRequest() {
  return { ok: true };
}
