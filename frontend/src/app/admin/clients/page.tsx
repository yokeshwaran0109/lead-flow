"use client";

import { useAdminData } from "@/lib/adminData";

export default function ClientsPage() {
  const { studios } = useAdminData();

  return (
    <div>
      <p className="mb-5 text-sm text-inkdim">Every studio using Lead Flow.</p>
      {studios.length === 0 && <div className="card text-inkdim">No clients yet.</div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {studios.map((s) => {
          const initials = s.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return (
            <div key={s.id} className="card">
              <div className="mb-4 flex items-center gap-3.5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#E8540B,#8a3407)] font-display text-[13px] font-bold text-[#14110e]">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[15px] font-bold">{s.name}</div>
                  <div className="truncate text-xs text-inkdim">{s.email}</div>
                </div>
                <div className="flex-shrink-0 rounded-full border border-[rgba(232,84,11,.2)] bg-golddim px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-goldbright">
                  {s.plan}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-bgraise py-2.5 text-center">
                  <div className="font-display text-[17px] font-bold">{s.orders_count}</div>
                  <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-wide text-inkdim">Orders</div>
                </div>
                <div className="rounded-lg bg-bgraise py-2.5 text-center">
                  <div className="font-display text-[17px] font-bold">{s.files_total}</div>
                  <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-wide text-inkdim">Files</div>
                </div>
                <div className="rounded-lg bg-bgraise py-2.5 text-center">
                  <div className="font-display text-[13px] font-bold">£{Number(s.revenue).toFixed(2)}</div>
                  <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-wide text-inkdim">Revenue</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
