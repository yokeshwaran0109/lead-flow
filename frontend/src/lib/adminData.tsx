"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { AdminJobOut, StudioSummary } from "./types";

interface Notification {
  text: string;
  time: Date;
}

interface AdminDataState {
  jobs: AdminJobOut[];
  studios: StudioSummary[];
  notifications: Notification[];
  unread: boolean;
  markRead: () => void;
  refresh: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataState | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<AdminJobOut[]>([]);
  const [studios, setStudios] = useState<StudioSummary[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(false);
  const knownJobIds = useRef<Set<string> | null>(null);
  const knownStudioIds = useRef<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [studiosRes, jobsRes] = await Promise.all([
        api<StudioSummary[]>("/admin/studios"),
        api<AdminJobOut[]>("/admin/jobs"),
      ]);
      const newNotifs: Notification[] = [];
      if (knownJobIds.current) {
        jobsRes
          .filter((j) => !knownJobIds.current!.has(j.id))
          .forEach((j) => newNotifs.push({ text: `New order: ${j.name} from ${j.studio.name} (${j.ref})`, time: new Date() }));
      }
      knownJobIds.current = new Set(jobsRes.map((j) => j.id));
      if (knownStudioIds.current) {
        studiosRes
          .filter((s) => !knownStudioIds.current!.has(s.id))
          .forEach((s) => newNotifs.push({ text: `New client signed up: ${s.name}`, time: new Date() }));
      }
      knownStudioIds.current = new Set(studiosRes.map((s) => s.id));
      if (newNotifs.length) {
        setNotifications((prev) => [...newNotifs, ...prev].slice(0, 30));
        setUnread(true);
      }
      setJobs(jobsRes);
      setStudios(studiosRes);
    } catch {
      /* ignore poll errors */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const markRead = useCallback(() => setUnread(false), []);

  return (
    <AdminDataContext.Provider value={{ jobs, studios, notifications, unread, markRead, refresh }}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData(): AdminDataState {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
