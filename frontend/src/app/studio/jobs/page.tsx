"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { STAGES } from "@/lib/types";
import type { FileOut, InvoiceOut, JobOut } from "@/lib/types";
import StageRail from "@/components/StageRail";
import { STAGE_BADGE_CLASSES } from "@/lib/stageStyle";
import InvoiceModal, { InvoiceModalData } from "@/components/InvoiceModal";

interface JobWithExtras extends JobOut {
  filesCount: number;
  invoice: InvoiceOut | null;
}

export default function JobsPage() {
  const showToast = useToast();
  const [current, setCurrent] = useState<JobWithExtras[]>([]);
  const [completed, setCompleted] = useState<JobWithExtras[]>([]);
  const [modalData, setModalData] = useState<InvoiceModalData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const jobs = await api<JobOut[]>("/jobs");
        const withExtras = await Promise.all(
          jobs.map(async (j) => {
            let filesCount = 0;
            try {
              const files = await api<FileOut[]>(`/jobs/${j.id}/files`);
              filesCount = files.length;
            } catch {
              /* ignore */
            }
            let invoice: InvoiceOut | null = null;
            if (j.stage >= 4) {
              try {
                invoice = await api<InvoiceOut>(`/jobs/${j.id}/invoice`);
              } catch {
                /* ignore */
              }
            }
            return { ...j, filesCount, invoice };
          })
        );
        if (cancelled) return;
        setCurrent(withExtras.filter((j) => j.stage < 5));
        setCompleted(withExtras.filter((j) => j.stage === 5));
      } catch (err) {
        if (!cancelled) showToast(err instanceof Error ? err.message : "Could not load jobs");
      }
    }
    load();
    const t = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openInvoice(j: JobWithExtras) {
    if (!j.invoice) return;
    setModalData({
      invoiceNumber: j.invoice.invoice_number,
      billedToName: j.name,
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
      <div className="mb-6 flex items-center gap-3.5">
        <h2 className="whitespace-nowrap text-sm font-bold">Current jobs</h2>
        <div className="h-px flex-1 bg-linesoft" />
      </div>
      <div className="flex flex-col gap-3">
        {current.length === 0 && <div className="card text-inkdim">No active jobs yet.</div>}
        {current.map((j) => (
          <div key={j.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-bold">{j.name}</h3>
                <div className="mt-1 text-[12.5px] text-inkdim">
                  Ref <b className="text-inkmid">{j.ref}</b> · {j.filesCount.toLocaleString("en-GB")} files · {j.spec}
                </div>
              </div>
              <span className={`badge ${STAGE_BADGE_CLASSES[j.stage]}`}>
                <span className="badge-dot" />
                {STAGES[j.stage]}
              </span>
            </div>
            <StageRail stage={j.stage} />
            <div className="mt-4 flex items-center justify-between border-t border-linesoft pt-4 text-[13px] text-inkmid">
              <span>
                Turnaround: <b>{j.turnaround}</b>
              </span>
              <div className="flex items-center gap-3.5">
                {j.stage === 4 && j.invoice && (
                  <button onClick={() => openInvoice(j)} className="text-[12.5px] font-semibold text-goldbright hover:text-gold">
                    View invoice
                  </button>
                )}
                <span>{j.stage === 0 ? "Awaiting acceptance" : j.due_date ? `Due ${new Date(j.due_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}` : "In progress"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {completed.length > 0 && (
        <>
          <div className="mb-4 mt-10 flex items-center gap-3.5">
            <h2 className="whitespace-nowrap text-sm font-bold">Completed jobs</h2>
            <div className="h-px flex-1 bg-linesoft" />
          </div>
          <div className="card overflow-x-auto p-1">
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wide text-inkdim">
                  <th className="p-3 font-semibold">Job</th>
                  <th className="p-3 font-semibold">Delivered</th>
                  <th className="p-3 font-semibold">Files</th>
                  <th className="p-3 font-semibold">Spec</th>
                  <th className="p-3 font-semibold">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((j) => (
                  <tr key={j.id} className="border-t border-linesoft text-[13.5px] hover:bg-[rgba(232,84,11,.04)]">
                    <td className="p-3">
                      <div className="font-semibold">{j.name}</div>
                      <div className="text-xs text-inkdim">Ref {j.ref}</div>
                    </td>
                    <td className="p-3">
                      {j.invoice?.paid_at
                        ? new Date(j.invoice.paid_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="p-3">{j.filesCount.toLocaleString("en-GB")}</td>
                    <td className="p-3">{j.spec}</td>
                    <td className="p-3">
                      <button
                        onClick={() => openInvoice(j)}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-inkmid hover:border-gold hover:bg-golddim"
                      >
                        {j.invoice?.invoice_number || "—"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <InvoiceModal open={!!modalData} onClose={() => setModalData(null)} data={modalData} />
    </div>
  );
}
