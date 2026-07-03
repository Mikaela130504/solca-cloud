import axios from "axios";

export const API_CONFIG = {
  authUrl: import.meta.env.VITE_AUTH_API_URL || "http://localhost:8000",
  patientUrl: import.meta.env.VITE_PATIENT_API_URL || "http://localhost:8001",
  consultationUrl: import.meta.env.VITE_CONSULTATION_API_URL || "http://localhost:8002",
  laboratoryUrl: import.meta.env.VITE_LABORATORY_API_URL || "http://localhost:8003",
  imagingUrl: import.meta.env.VITE_IMAGING_API_URL || "http://localhost:8004",
  repositoryUrl: import.meta.env.VITE_REPOSITORY_API_URL || "http://localhost:8005",
  timeout: 12000,
};

const STORAGE_KEY = "solca-auth-session";

export function getToken() {
  const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return "";
  try {
    return JSON.parse(stored)?.token || "";
  } catch {
    return "";
  }
}

export function createApiClient(baseURL) {
  const client = axios.create({ baseURL, timeout: API_CONFIG.timeout });
  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}

export const createServiceError = (message) => ({
  message,
  timestamp: new Date().toISOString(),
});
