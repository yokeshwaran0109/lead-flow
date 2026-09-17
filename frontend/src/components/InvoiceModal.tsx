"use client";

import type { InvoiceLine } from "@/lib/types";

export interface InvoiceModalData {
  invoiceNumber: string;
  billedToName: string;
  billedToSub?: string;
  issuedDate: string;
  jobRef: string;
  jobName: string;
  lines: InvoiceLine[];
  total: number;
  note?: string;
  paid: boolean;
}

export default function InvoiceModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: InvoiceModalData | null;
}) {
  if (!open || !data) return null;

  const isTax = (d: string) => d.toLowerCase().startsWith("tax");
  const subtotal = data.lines.filter((l) => !isTax(l.description)).reduce((s, l) => s + Number(l.amount), 0);
  const taxLines = data.lines.filter((l) => isTax(l.description));
  const tax = taxLines.reduce((s, l) => s + Number(l.amount), 0);

  async function downloadPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 48;
    const right = 547;
    let y = 56;
    if (!data) return;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ELYON", left, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("Editing Services via Lead Flow Gateway", left, y + 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("INVOICE", right, y - 6, { align: "right" });
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(data.invoiceNumber, right, y + 10, { align: "right" });

    y += 34;
    doc.setDrawColor(220, 220, 220);
    doc.line(left, y, right, y);
    y += 24;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 140);
    doc.text("BILLED TO", left, y);
    doc.text("DETAILS", 320, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(data.billedToName, left, y + 15);
    if (data.billedToSub) doc.text(data.billedToSub, left, y + 29);
    doc.text(`Issued: ${data.issuedDate}`, 320, y + 15);
    doc.text(`Job ref: ${data.jobRef}`, 320, y + 29);

    y += 60;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(140, 140, 140);
    doc.text("DESCRIPTION", left, y);
    doc.text("QTY", 380, y);
    doc.text("AMOUNT", right, y, { align: "right" });
    y += 8;
    doc.setDrawColor(220, 220, 220);
    doc.line(left, y, right, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    data.lines.forEach((l) => {
      doc.text(String(l.description), left, y);
      doc.text(String(l.qty), 380, y);
      doc.text(`£${Number(l.amount).toFixed(2)}`, right, y, { align: "right" });
      y += 18;
    });

    y += 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(left, y, right, y);
    y += 20;

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("Subtotal", 460, y, { align: "right" });
    doc.text(`£${subtotal.toFixed(2)}`, right, y, { align: "right" });
    y += 16;
    if (tax > 0) {
      doc.text(taxLines[0]?.description || "Tax", 460, y, { align: "right" });
      doc.text(`£${tax.toFixed(2)}`, right, y, { align: "right" });
      y += 16;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text("Total", 460, y + 6, { align: "right" });
    doc.text(`£${data.total.toFixed(2)}`, right, y + 6, { align: "right" });
    y += 34;

    if (data.note) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(140, 140, 140);
      doc.text("NOTE", left, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const wrapped = doc.splitTextToSize(data.note, right - left);
      doc.text(wrapped, left, y + 14);
      y += 14 + wrapped.length * 13;
    }

    if (data.paid) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(125, 169, 122);
      doc.text("PAID", left, y + 16);
    }

    doc.save(`${data.invoiceNumber || "invoice"}.pdf`);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl border border-line bg-bgcard">
        <div className="p-9">
          <div className="flex items-start justify-between border-b border-linesoft pb-6">
            <div>
              <div className="font-display text-lg font-extrabold">ELYON</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-inkdim">
                Editing Services
                <br />
                via Lead Flow Gateway
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-inkdim">Invoice</div>
              <div className="mt-0.5 font-display text-base font-bold">{data.invoiceNumber}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <div className="mb-1 text-[10.5px] uppercase tracking-wide text-inkdim">Billed to</div>
              <div>{data.billedToName}</div>
              {data.billedToSub && <div className="text-inkdim">{data.billedToSub}</div>}
            </div>
            <div>
              <div className="mb-1 text-[10.5px] uppercase tracking-wide text-inkdim">Details</div>
              <div>
                Issued: {data.issuedDate}
                <br />
                <span className="text-inkdim">Job ref: {data.jobRef}</span>
              </div>
            </div>
          </div>

          <table className="mt-6 w-full border-collapse">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-inkdim">
                <th className="pb-2.5 font-semibold">Description</th>
                <th className="pb-2.5 font-semibold">Qty</th>
                <th className="pb-2.5 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((l, i) => (
                <tr key={i} className="border-b border-linesoft text-[13.5px]">
                  <td className="py-3">
                    {l.description}
                    <small className="mt-0.5 block text-xs text-inkdim">{data.jobName}</small>
                  </td>
                  <td className="py-3">{l.qty}</td>
                  <td className="py-3 text-right font-semibold">£{Number(l.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex flex-col items-end gap-2">
            <div className="flex gap-10 text-[13.5px] text-inkmid">
              <span>Subtotal</span>
              <span className="min-w-[90px] text-right">£{subtotal.toFixed(2)}</span>
            </div>
            {tax > 0 && (
              <div className="flex gap-10 text-[13.5px] text-inkmid">
                <span>{taxLines[0]?.description || "Tax"}</span>
                <span className="min-w-[90px] text-right">£{tax.toFixed(2)}</span>
              </div>
            )}
            <div className="mt-1 flex gap-10 border-t border-line pt-3 text-lg font-bold">
              <span>Total</span>
              <span className="min-w-[90px] text-right text-goldbright">£{data.total.toFixed(2)}</span>
            </div>
          </div>

          {data.note && (
            <div className="mt-4 border-t border-linesoft pt-4">
              <div className="text-[10.5px] uppercase tracking-wide text-inkdim">Note</div>
              <div className="mt-1 text-[13.5px] text-inkmid">{data.note}</div>
            </div>
          )}

          {data.paid && (
            <div className="mt-4 inline-flex -rotate-2 items-center gap-1.5 rounded-lg border-[1.5px] border-green px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-green">
              ✓ Paid
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-9 pb-8">
          <button className="btn btn-ghost" onClick={downloadPdf}>
            Download PDF
          </button>
          <button className="btn btn-gold" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
