"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { AdminOut, Role, StudioOut } from "./types";

interface AuthState {
  ready: boolean;
  role: Role | null;
  studio: StudioOut | null;
  admin: AdminOut | null;
  setSession: (token: string, role: Role) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [studio, setStudio] = useState<StudioOut | null>(null);
  const [admin, setAdmin] = useState<AdminOut | null>(null);

  const loadProfile = useCallback(async (r: Role) => {
    if (r === "admin") {
      const a = await api<AdminOut>("/admin/me");
      setAdmin(a);
      setStudio(null);
    } else {
      const s = await api<StudioOut>("/auth/me");
      setStudio(s);
      setAdmin(null);
    }
  }, []);

  const setSession = useCallback(
    async (token: string, r: Role) => {
      try {
        localStorage.setItem("lf_token", token);
        localStorage.setItem("lf_role", r);
      } catch {
        /* ignore */
      }
      setRole(r);
      await loadProfile(r);
    },
    [loadProfile]
  );

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("lf_token");
      localStorage.removeItem("lf_role");
    } catch {
      /* ignore */
    }
    setRole(null);
    setStudio(null);
    setAdmin(null);
  }, []);

  const refresh = useCallback(async () => {
    if (role) await loadProfile(role);
  }, [role, loadProfile]);

  useEffect(() => {
    (async () => {
      let savedRole: string | null = null;
      try {
        savedRole = localStorage.getItem("lf_role");
      } catch {
        /* ignore */
      }
      if (savedRole === "admin" || savedRole === "studio") {
        setRole(savedRole);
        try {
          await loadProfile(savedRole);
        } catch {
          logout();
        }
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ ready, role, studio, admin, setSession, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
