"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AdminDataProvider, useAdminData } from "@/lib/adminData";
import NotificationBell from "@/components/NotificationBell";
import NewOrderModal from "@/components/admin/NewOrderModal";

const NAV_OVERVIEW = [
  { href: "/admin", label: "Dashboard", title: "Dashboard" },
  { href: "/admin/orders", label: "All Orders", title: "All Orders" },
  { href: "/admin/clients", label: "Clients", title: "Clients" },
];
const NAV_FINANCE = [
  { href: "/admin/invoices", label: "Invoices", title: "Invoices" },
  { href: "/admin/analytics", label: "Analytics", title: "Analytics" },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { studios, refresh } = useAdminData();
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const all = [...NAV_OVERVIEW, ...NAV_FINANCE];
  const current = all.find((n) => n.href === pathname) || all[0];

  return (
    <div className="min-h-screen lg:flex">
      <div className="flex items-center justify-between border-b border-linesoft bg-bgraise p-4 lg:hidden">
        <div className="font-display text-base font-extrabold">
          LEAD<span className="text-gold">FLOW</span>
        </div>
        <button onClick={() => setSidebarOpen((v) => !v)} className="rounded-lg border border-line px-3 py-1.5 text-xs text-inkmid">
          Menu
        </button>
      </div>

      <div className={`w-full flex-shrink-0 border-r border-linesoft bg-bgraise p-3.5 lg:block lg:w-[230px] ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="border-b border-linesoft px-2.5 pb-5 pt-1">
          <div className="font-display text-[17px] font-extrabold">
            LEAD<span className="text-gold">FLOW</span>
            <small className="mt-[-2px] block text-[9.5px] font-semibold uppercase tracking-widest text-inkdim">Admin Panel</small>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(232,84,11,.25)] bg-golddim px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wide text-goldbright">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Admin
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 px-2.5 font-display text-[10px] font-bold uppercase tracking-widest text-inkdim">Overview</div>
          {NAV_OVERVIEW.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setSidebarOpen(false)}
              className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-4 py-2.5 font-display text-sm font-semibold transition-colors ${
                pathname === n.href ? "bg-golddim text-goldbright" : "text-inkmid hover:bg-bgcard hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
        <div className="mt-5">
          <div className="mb-1.5 px-2.5 font-display text-[10px] font-bold uppercase tracking-widest text-inkdim">Finance</div>
          {NAV_FINANCE.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setSidebarOpen(false)}
              className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-4 py-2.5 font-display text-sm font-semibold transition-colors ${
                pathname === n.href ? "bg-golddim text-goldbright" : "text-inkmid hover:bg-bgcard hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 border-t border-linesoft px-2.5 pt-4">
          <div className="truncate text-[13px] font-semibold">{admin?.name}</div>
          <div className="text-[10.5px] uppercase tracking-wide text-inkdim">Admin · Full access</div>
          <button
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="mt-2 text-[12px] font-semibold text-inkdim underline underline-offset-2 hover:text-goldbright"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1 px-5 pb-20 pt-7 sm:px-10">
        <div className="mb-7 flex items-center justify-between gap-4 border-b border-linesoft pb-5">
          <h1 className="text-xl font-bold sm:text-2xl">{current.title}</h1>
          <div className="flex flex-shrink-0 items-center gap-3">
            <NotificationBell />
            <button onClick={() => setNewOrderOpen(true)} className="btn btn-gold whitespace-nowrap px-4 py-2.5 text-[13.5px]">
              + New Order
            </button>
          </div>
        </div>
        {children}
      </div>

      <NewOrderModal open={newOrderOpen} studios={studios} onClose={() => setNewOrderOpen(false)} onCreated={refresh} />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ready, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && role !== "admin") router.replace("/");
  }, [ready, role, router]);

  if (!ready || role !== "admin") {
    return <div className="flex min-h-screen items-center justify-center text-inkdim">Loading…</div>;
  }

  return (
    <AdminDataProvider>
      <AdminShell>{children}</AdminShell>
    </AdminDataProvider>
  );
}
