"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import ProfileMenu from "@/components/ProfileMenu";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const { ready, role, studio } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && role !== "studio") router.replace("/");
  }, [ready, role, router]);

  if (!ready || role !== "studio" || !studio) {
    return <div className="flex min-h-screen items-center justify-center text-inkdim">Loading…</div>;
  }

  const initials = studio.name
    .split(" ")
    .filter((w) => /^[A-Za-z]/.test(w))
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const plan = (studio.location ? studio.location + " · " : "") + studio.plan;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 flex h-[70px] items-center justify-between border-b border-linesoft bg-bg/92 px-6 backdrop-blur-md sm:px-10">
        <div className="font-display text-lg font-extrabold">
          LEAD<span className="text-gold">FLOW</span>
          <small className="mt-[-2px] block text-[10px] font-semibold uppercase tracking-widest text-inkdim">
            Editing Portal
          </small>
        </div>
        <div className="flex gap-1.5">
          <Link
            href="/studio"
            className={`rounded-lg px-4 py-2.5 font-display text-sm font-semibold transition-colors ${
              pathname === "/studio" ? "bg-golddim text-goldbright" : "text-inkmid hover:text-ink"
            }`}
          >
            New Job
          </Link>
          <Link
            href="/studio/jobs"
            className={`rounded-lg px-4 py-2.5 font-display text-sm font-semibold transition-colors ${
              pathname === "/studio/jobs" ? "bg-golddim text-goldbright" : "text-inkmid hover:text-ink"
            }`}
          >
            Jobs
          </Link>
        </div>
        <div className="hidden sm:block">
          <ProfileMenu initials={initials || "ST"} name={studio.name} plan={plan} />
        </div>
      </div>
      <div className="flex justify-end px-6 pt-3 sm:hidden">
        <ProfileMenu initials={initials || "ST"} name={studio.name} plan={plan} />
      </div>

      <div className="mx-auto max-w-[900px] px-5 pb-20 pt-8 sm:px-10">
        <div className="mb-8">
          <div className="font-display text-xl font-extrabold">Welcome, {studio.name}</div>
          <div className="mt-1 text-sm text-inkmid">
            Upload session files, track edit progress, and manage invoices with Elyon.
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
