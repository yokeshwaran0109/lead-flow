"use client";

import { useState } from "react";
import { useAdminData } from "@/lib/adminData";
import type { AdminJobOut } from "@/lib/types";
import JobCard from "@/components/admin/JobCard";
import JobDetailModal from "@/components/admin/JobDetailModal";
import SendInvoiceModal from "@/components/admin/SendInvoiceModal";
import InvoiceModal, { InvoiceModalData } from "@/components/InvoiceModal";

export default function InvoicesPage() {
  const { jobs, refresh } = useAdminData();
  const [detailJob, setDetailJob] = useState<AdminJobOut | null>(null);
  const [invoiceJob, setInvoiceJob] = useState<AdminJobOut | null>(null);
  const [viewData, setViewData] = useState<InvoiceModalData | null>(null);

  const awaiting = jobs.filter((j) => j.stage === 3 && !j.invoice);
  const invoiced = jobs.filter((j) => j.invoice);

  function openView(j: AdminJobOut) {
    if (!j.invoice) return;
    setViewData({
      invoiceNumber: j.invoice.invoice_number,
      billedToName: j.studio.name,
      billedToSub: j.studio.email,
      issuedDate: new Date(j.invoice.issued_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      jobRef: j.ref,
      jobName: j.name,
      lines: j.invoice.lines,
      total: Number(j.invoice.total_amount),
      note: j.invoice.note,
      paid: j.invoice.paid,
    });
  }

  return (
    <div>
      <p className="mb-5 text-sm text-inkdim">Every invoice sent or paid, across all client studios.</p>

      <div className="mb-4 flex items-center gap-3.5">
        <h2 className="whitespace-nowrap text-sm font-bold">Awaiting invoice</h2>
        <div className="h-px flex-1 bg-linesoft" />
      </div>
      <div className="mb-8">
        {awaiting.length === 0 && <div className="card text-inkdim">No jobs waiting on an invoice.</div>}
        {awaiting.map((j) => (
          <JobCard key={j.id} job={j} onChanged={refresh} onOpenDetail={setDetailJob} onSendInvoice={setInvoiceJob} />
        ))}
      </div>

      <div className="mb-4 flex items-center gap-3.5">
        <h2 className="whitespace-nowrap text-sm font-bold">Sent &amp; paid</h2>
        <div className="h-px flex-1 bg-linesoft" />
      </div>
      <div className="card overflow-x-auto p-1">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="text-left text-[10.5px] uppercase tracking-wide text-inkdim">
              <th className="p-3 font-semibold">Job</th>
              <th className="p-3 font-semibold">Client</th>
              <th className="p-3 font-semibold">Invoice #</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {invoiced.length === 0 && (
              <tr>
                <td colSpan={7} className="p-3 text-inkdim">
                  No invoices yet.
                </td>
              </tr>
            )}
            {invoiced.map((j) => (
              <tr key={j.id} className="border-t border-linesoft text-[13.5px] hover:bg-[rgba(232,84,11,.04)]">
                <td className="p-3">
                  <div className="font-semibold">{j.name}</div>
                  <div className="text-xs text-inkdim">{j.ref}</div>
                </td>
                <td className="p-3">{j.studio.name}</td>
                <td className="p-3">{j.invoice?.invoice_number}</td>
                <td className="p-3">{j.invoice && new Date(j.invoice.issued_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="p-3">£{Number(j.invoice?.total_amount || 0).toFixed(2)}</td>
                <td className="p-3">
                  <span className={`badge ${j.invoice?.paid ? "bg-[rgba(125,169,122,.22)] text-[#9fd29b]" : "bg-[rgba(232,84,11,.16)] text-[#FF9A66]"}`}>
                    <span className="badge-dot" />
                    {j.invoice?.paid ? "Paid" : "Sent"}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => openView(j)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-inkmid hover:border-gold hover:bg-golddim">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <JobDetailModal job={detailJob} onClose={() => setDetailJob(null)} />
      <SendInvoiceModal job={invoiceJob} onClose={() => setInvoiceJob(null)} onSent={refresh} />
      <InvoiceModal open={!!viewData} onClose={() => setViewData(null)} data={viewData} />
    </div>
  );
}
