"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { AdminJobOut } from "@/lib/types";

export default function SendInvoiceModal({
  job,
  onClose,
  onSent,
}: {
  job: AdminJobOut | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const showToast = useToast();
  const [description, setDescription] = useState("Studio editing");
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState<number | "">("");
  const [taxPct, setTaxPct] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!job) return;
    setDescription(job.spec);
    setQty(job.files_count || 1);
    setRate("");
    setTaxPct(0);
    setNote("");
  }, [job]);

  if (!job) return null;

  const rateNum = Number(rate) || 0;
  const subtotal = qty * rateNum;
  const tax = subtotal * (taxPct / 100);
  const total = subtotal + tax;

  const invNumber = `ELY-${new Date().getFullYear()}-${job.ref.replace(/^LF-/, "")}`;
  const issuedDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  async function submit() {
    if (!job) return;
    setSubmitting(true);
    const lines = [{ description, qty, amount: subtotal }];
    if (tax > 0) lines.push({ description: `Tax (${taxPct}%)`, qty: 1, amount: Math.round(tax * 100) / 100 });
    try {
      await api(`/jobs/${job.id}/invoice`, {
        method: "POST",
        body: { lines, total_amount: subtotal + tax, note },
      });
      showToast("Invoice sent");
      onSent();
      onClose();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not create invoice");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border border-line bg-bgcard">
        <div className="p-9">
          <h3 className="mb-4 text-lg font-bold">Create &amp; send invoice</h3>
          <div className="mb-5 grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-inkdim">Company</div>
              <div>Elyon Studio</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-inkdim">Invoice #</div>
              <div className="text-inkdim">{invNumber}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-inkdim">Billed to</div>
              <div>{job.studio.name}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-inkdim">Issued date</div>
              <div className="text-inkdim">{issuedDate}</div>
            </div>
          </div>

          <div className="mb-4">
            <label className="field-label">Description (what order)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="field-input" />
          </div>
          <div className="mb-4 flex gap-3.5">
            <div className="flex-1">
              <label className="field-label">Quantity</label>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} className="field-input" />
            </div>
            <div className="flex-1">
              <label className="field-label">Amount per unit (£)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={rate}
                onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))}
                className="field-input"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="field-label">VAT / Tax (%) — optional</label>
            <input type="number" min={0} step="0.01" value={taxPct} onChange={(e) => setTaxPct(Number(e.target.value) || 0)} className="field-input" />
          </div>
          <div className="mb-5">
            <label className="field-label">Invoice note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="field-input resize-y" placeholder="e.g. payment terms, thank-you note…" />
          </div>

          <div className="border-t border-linesoft pt-4">
            <div className="mb-1.5 flex justify-between text-[13.5px] text-inkmid">
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className="mb-1.5 flex justify-between text-[13.5px] text-inkmid">
              <span>VAT / Tax</span>
              <span>£{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[17px] font-bold">
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-9 pb-8">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-gold" disabled={submitting} onClick={submit}>
            Send invoice
          </button>
        </div>
      </div>
    </div>
  );
}
