import { createContext, useEffect, useState } from "react";

import api from "../api";
import { clearStoredSession, getStoredSession, setStoredSession } from "../utils/session";

export const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredSession());
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredSession();
      setSession(null);
      setStatus("ready");
    };

    window.addEventListener("pgms:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("pgms:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    const existingSession = getStoredSession();

    if (!existingSession?.accessToken) {
      setStatus("ready");
      return;
    }

    let ignore = false;

    const bootstrapSession = async () => {
      try {
        const response = await api.get("/auth/me");
        const nextSession = {
          ...existingSession,
          user: response.data
        };
        setStoredSession(nextSession);
        if (!ignore) {
          setSession(nextSession);
        }
      } catch {
        clearStoredSession();
        if (!ignore) {
          setSession(null);
        }
      } finally {
        if (!ignore) {
          setStatus("ready");
        }
      }
    };

    bootstrapSession();

    return () => {
      ignore = true;
    };
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    const nextSession = {
      accessToken: response.data.access_token,
      user: response.data.user
    };
    setStoredSession(nextSession);
    setSession(nextSession);
    return response.data.user;
  };

  const logout = () => {
    clearStoredSession();
    setSession(null);
  };

  const refreshUser = async () => {
    const currentSession = getStoredSession() || session;
    const response = await api.get("/auth/me");
    const nextSession = {
      ...currentSession,
      user: response.data
    };
    setStoredSession(nextSession);
    setSession(nextSession);
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        session,
        user: session?.user || null,
        isAuthenticated: Boolean(session?.accessToken),
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
