"use client";

import { api, ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { STAGES } from "@/lib/types";
import type { AdminJobOut } from "@/lib/types";
import StageRail from "@/components/StageRail";
import { STAGE_BADGE_CLASSES } from "@/lib/stageStyle";

export default function JobCard({
  job,
  onChanged,
  onOpenDetail,
  onSendInvoice,
}: {
  job: AdminJobOut;
  onChanged: () => void;
  onOpenDetail: (job: AdminJobOut) => void;
  onSendInvoice: (job: AdminJobOut) => void;
}) {
  const showToast = useToast();

  async function setStage(stage: number) {
    if (stage === 4) {
      showToast('Use "Send invoice" to move a job to Invoice Sent');
      return;
    }
    if (stage === 5) {
      showToast('Use "Mark paid" to move a job to Invoice Paid');
      return;
    }
    try {
      await api(`/jobs/${job.id}/stage`, { method: "PATCH", body: { stage } });
      showToast("Stage updated");
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not update stage");
    }
  }

  async function markPaid() {
    try {
      await api(`/jobs/${job.id}/invoice/pay`, { method: "POST" });
      showToast("Marked as paid");
      onChanged();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not mark paid");
    }
  }

  return (
    <div className="card mb-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold">{job.name}</h3>
          <div className="mt-1 text-[12.5px] text-inkdim">
            Ref <b className="text-inkmid">{job.ref}</b> · {job.studio.name} · {job.spec}
          </div>
        </div>
        <span className={`badge ${STAGE_BADGE_CLASSES[job.stage]}`}>
          <span className="badge-dot" />
          {STAGES[job.stage]}
        </span>
      </div>
      <StageRail stage={job.stage} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-linesoft pt-4 text-[13px] text-inkmid">
        <span>
          Turnaround: <b>{job.turnaround}</b>
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenDetail(job)}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-inkmid hover:border-gold hover:bg-golddim"
          >
            Files &amp; notes
          </button>
          <select
            value={job.stage}
            onChange={(e) => setStage(Number(e.target.value))}
            className="rounded-lg border border-line bg-bgraise px-2.5 py-1.5 text-xs text-ink"
          >
            {STAGES.map((s, i) => (
              <option key={s} value={i} disabled={i < job.stage || i === 4 || i === 5}>
                {s}
                {i < job.stage ? " ✓" : ""}
              </option>
            ))}
          </select>
          {job.stage === 3 && (
            <button
              onClick={() => onSendInvoice(job)}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-inkmid hover:border-gold hover:bg-golddim"
            >
              Send invoice
            </button>
          )}
          {job.stage === 4 && (
            <button
              onClick={markPaid}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-inkmid hover:border-gold hover:bg-golddim"
            >
              Mark paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
