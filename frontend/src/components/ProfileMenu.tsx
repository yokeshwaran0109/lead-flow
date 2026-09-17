"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function ProfileMenu({
  initials,
  name,
  plan,
}: {
  initials: string;
  name: string;
  plan: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const router = useRouter();

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
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#E8540B,#8a3407)] font-display text-[13px] font-bold text-[#14110e]"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-52 rounded-card border border-line bg-bgcard p-3 shadow-2xl">
          <div className="px-2 pb-2.5">
            <div className="truncate text-[13px] font-semibold">{name}</div>
            <div className="truncate text-[10.5px] uppercase tracking-wide text-inkdim">{plan}</div>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="flex w-full items-center gap-2 rounded-lg border-t border-linesoft px-2 pt-2.5 pb-1 text-[13px] font-semibold text-inkdim transition-colors hover:text-red"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
