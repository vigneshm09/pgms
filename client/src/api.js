import axios from "axios";

import { clearStoredSession, getAccessToken } from "./utils/session";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();
      window.dispatchEvent(new Event("pgms:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export const buildApiAssetUrl = (path) => {
  if (!path) {
    return null;
  }

  return `${API_BASE_URL}${path}`;
};

export default api;
