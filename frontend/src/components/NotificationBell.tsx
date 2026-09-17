"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminData } from "@/lib/adminData";

export default function NotificationBell() {
  const { notifications, unread, markRead } = useAdminData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markRead();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-bgcard text-inkmid transition-colors hover:border-gold hover:text-goldbright"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread && <span className="absolute right-[7px] top-[7px] h-2 w-2 rounded-full border-2 border-bgcard bg-gold" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-[80] max-h-[360px] w-[300px] overflow-y-auto rounded-card border border-line bg-bgcard p-2 shadow-2xl">
          <div className="px-2.5 py-2 font-display text-[11px] font-bold uppercase tracking-wide text-inkdim">
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div className="px-2.5 py-4 text-[13px] text-inkdim">No notifications yet.</div>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="rounded-lg p-2.5 text-[13px] hover:bg-bgraise">
                {n.text}
                <div className="mt-0.5 text-[11px] text-inkdim">
                  {n.time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
