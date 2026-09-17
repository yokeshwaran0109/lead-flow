"use client";

import { useMemo, useState } from "react";
import { useAdminData } from "@/lib/adminData";
import { STAGES } from "@/lib/types";
import type { AdminJobOut } from "@/lib/types";
import JobCard from "@/components/admin/JobCard";
import JobDetailModal from "@/components/admin/JobDetailModal";
import SendInvoiceModal from "@/components/admin/SendInvoiceModal";

export default function OrdersPage() {
  const { jobs, refresh } = useAdminData();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [detailJob, setDetailJob] = useState<AdminJobOut | null>(null);
  const [invoiceJob, setInvoiceJob] = useState<AdminJobOut | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchQ = !q || j.ref.toLowerCase().includes(q) || j.name.toLowerCase().includes(q) || j.studio.name.toLowerCase().includes(q);
      const matchSt = status === "" || String(j.stage) === status;
      return matchQ && matchSt;
    });
  }, [jobs, search, status]);

  return (
    <div>
      <p className="mb-5 text-sm text-inkdim">Every order across every studio, unfiltered.</p>
      <div className="card mb-6 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" className="field-input min-w-[220px] flex-1" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-input w-auto min-w-[160px] flex-none">
          <option value="">All statuses</option>
          {STAGES.map((s, i) => (
            <option key={s} value={i}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {filtered.length === 0 && <div className="card text-inkdim">No orders match your filters.</div>}
      {filtered.map((j) => (
        <JobCard key={j.id} job={j} onChanged={refresh} onOpenDetail={setDetailJob} onSendInvoice={setInvoiceJob} />
      ))}
      <JobDetailModal job={detailJob} onClose={() => setDetailJob(null)} />
      <SendInvoiceModal job={invoiceJob} onClose={() => setInvoiceJob(null)} onSent={refresh} />
    </div>
  );
}
