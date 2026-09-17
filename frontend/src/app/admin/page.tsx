"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "@/lib/adminData";
import { SERVICES, STAGES } from "@/lib/types";
import type { AdminJobOut } from "@/lib/types";
import JobCard from "@/components/admin/JobCard";
import JobDetailModal from "@/components/admin/JobDetailModal";
import SendInvoiceModal from "@/components/admin/SendInvoiceModal";

type StatFilter = "total" | "progress" | "completed";
type SortField = "date" | "order" | "status";

export default function DashboardPage() {
  const { jobs, refresh } = useAdminData();
  const [statFilter, setStatFilter] = useState<StatFilter>("total");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [detailJob, setDetailJob] = useState<AdminJobOut | null>(null);
  const [invoiceJob, setInvoiceJob] = useState<AdminJobOut | null>(null);

  const total = jobs.length;
  const inProgress = jobs.filter((j) => j.stage < 3).length;
  const completed = jobs.filter((j) => j.stage === 5).length;

  const filtered = useMemo(() => {
    let list = jobs;
    if (statFilter === "progress") list = list.filter((j) => j.stage < 3);
    else if (statFilter === "completed") list = list.filter((j) => j.stage === 5);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((j) => j.ref.toLowerCase().includes(q) || j.name.toLowerCase().includes(q));
    if (status !== "") list = list.filter((j) => String(j.stage) === status);
    if (service) list = list.filter((j) => j.spec === service);
    list = [...list].sort((a, b) => {
      let cmp: number;
      if (sortField === "order") cmp = a.ref.localeCompare(b.ref, undefined, { numeric: true });
      else if (sortField === "status") cmp = a.stage - b.stage;
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [jobs, statFilter, search, status, service, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir(field === "date" ? "desc" : "asc");
    }
  }

  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(
          [
            ["total", "Total orders", total],
            ["progress", "In progress", inProgress],
            ["completed", "Completed", completed],
          ] as [StatFilter, string, number][]
        ).map(([key, label, value]) => (
          <button
            key={key}
            onClick={() => setStatFilter(key)}
            className={`rounded-card border p-5 text-left transition-colors ${
              statFilter === key ? "border-gold bg-golddim" : "border-line bg-bgcard hover:border-gold"
            }`}
          >
            <div className="mb-2 font-display text-[10.5px] font-bold uppercase tracking-widest text-inkdim">{label}</div>
            <div className={`font-display text-3xl font-extrabold ${statFilter === key ? "text-goldbright" : "text-ink"}`}>{value}</div>
          </button>
        ))}
      </div>

      <div className="card mb-6 flex flex-col gap-3.5">
        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or job name…"
            className="field-input min-w-[220px] flex-1"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input w-auto min-w-[160px] flex-none">
            <option value="">All statuses</option>
            {STAGES.map((s, i) => (
              <option key={s} value={i}>
                {s}
              </option>
            ))}
          </select>
          <select value={service} onChange={(e) => setService(e.target.value)} className="field-input w-auto min-w-[160px] flex-none">
            <option value="">All services</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2.5 border-t border-linesoft pt-3.5">
          <span className="font-display text-[11px] font-bold uppercase tracking-wide text-inkdim">Sort by</span>
          {(["date", "order", "status"] as SortField[]).map((f) => (
            <button
              key={f}
              onClick={() => toggleSort(f)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                sortField === f ? "border-gold bg-golddim text-goldbright" : "border-line text-inkmid hover:border-inkdim"
              }`}
            >
              {f} {sortField === f ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <div className="card text-inkdim">No jobs yet.</div>}
      {filtered.map((j) => (
        <JobCard key={j.id} job={j} onChanged={refresh} onOpenDetail={setDetailJob} onSendInvoice={setInvoiceJob} />
      ))}

      <JobDetailModal job={detailJob} onClose={() => setDetailJob(null)} />
      <SendInvoiceModal job={invoiceJob} onClose={() => setInvoiceJob(null)} onSent={refresh} />
    </div>
  );
}
