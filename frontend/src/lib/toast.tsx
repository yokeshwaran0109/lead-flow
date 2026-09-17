"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext<((msg: string) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((m: string) => {
    setMsg(m);
    setShow(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2800);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 rounded-xl border border-gold bg-bgcard px-6 py-3.5 text-sm shadow-2xl transition-all duration-300 ${
          show ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-5"
        }`}
      >
        <span className="h-2 w-2 rounded-full bg-gold" />
        <span>{msg}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
