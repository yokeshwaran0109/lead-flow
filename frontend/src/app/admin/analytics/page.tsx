"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AnalyticsOut } from "@/lib/types";

const COLORS = ["#E8540B", "#7da97a", "#7a9abf", "#d0a878", "#c07a6a"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOut | null>(null);

  useEffect(() => {
    api<AnalyticsOut>("/admin/analytics").then(setData).catch(() => setData(null));
  }, []);

  const maxRev = Math.max(1, ...(data?.monthly_revenue.map((m) => m.total) || [0]));

  return (
    <div>
      <p className="mb-5 text-sm text-inkdim">Revenue trends and order volume across all studios.</p>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card">
          <div className="mb-2 font-display text-[10.5px] font-bold uppercase tracking-widest text-inkdim">Revenue this month</div>
          <div className="font-display text-2xl font-extrabold">£{(data?.revenue_this_month ?? 0).toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="mb-2 font-display text-[10.5px] font-bold uppercase tracking-widest text-inkdim">Avg order value</div>
          <div className="font-display text-2xl font-extrabold">£{(data?.avg_order_value ?? 0).toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="mb-2 font-display text-[10.5px] font-bold uppercase tracking-widest text-inkdim">Files edited</div>
          <div className="font-display text-2xl font-extrabold">{data?.files_edited ?? 0}</div>
        </div>
        <div className="card">
          <div className="mb-2 font-display text-[10.5px] font-bold uppercase tracking-widest text-inkdim">Avg turnaround</div>
          <div className="font-display text-2xl font-extrabold">{data?.avg_turnaround_hours ? `${Math.round(data.avg_turnaround_hours)}h` : "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h4 className="mb-5 text-[13px] font-bold">Monthly Revenue (£)</h4>
          <div className="flex h-36 items-end gap-2.5">
            {data?.monthly_revenue.map((m, i) => {
              const pct = Math.max((m.total / maxRev) * 100, 3);
              const isLast = i === data.monthly_revenue.length - 1;
              const label = new Date(`${m.month}-02`).toLocaleDateString("en-GB", { month: "short" });
              return (
                <div key={m.month} className="flex h-full flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end justify-center">
                    <div
                      className={`w-full rounded-t-md border ${isLast ? "border-gold bg-gold" : "border-[rgba(232,84,11,.25)] bg-golddim"}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10.5px] font-semibold text-inkdim">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h4 className="mb-5 text-[13px] font-bold">Orders by Service Type</h4>
          {(!data || data.service_breakdown.length === 0) && <div className="text-sm text-inkdim">No orders yet.</div>}
          <div className="flex flex-col gap-2.5">
            {data?.service_breakdown.map((s, i) => (
              <div key={s.spec} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="min-w-0 flex-1 truncate">{s.spec}</span>
                <span className="font-bold">{s.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
