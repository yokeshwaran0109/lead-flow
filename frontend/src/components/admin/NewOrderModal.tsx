"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError, uploadToPresignedUrl } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { SERVICES } from "@/lib/types";
import type { AdminJobOut, FilePresignResponse, StudioSummary } from "@/lib/types";

const TURNAROUNDS = ["Standard · 72h", "Priority · 48h", "Rush · 24h"];

export default function NewOrderModal({
  open,
  studios,
  onClose,
  onCreated,
}: {
  open: boolean;
  studios: StudioSummary[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const showToast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [studioId, setStudioId] = useState("");
  const [name, setName] = useState("");
  const [spec, setSpec] = useState(SERVICES[0]);
  const [turnaround, setTurnaround] = useState(TURNAROUNDS[0]);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStudioId(studios[0]?.id || "");
      setName("");
      setSpec(SERVICES[0]);
      setTurnaround(TURNAROUNDS[0]);
      setNotes("");
      setFiles([]);
    }
  }, [open, studios]);

  if (!open) return null;

  async function submit() {
    if (!studioId) {
      showToast("No studio to assign this order to");
      return;
    }
    setSubmitting(true);
    try {
      const job = await api<AdminJobOut>("/admin/jobs", {
        method: "POST",
        body: { studio_id: studioId, name: name.trim() || "Untitled shoot", spec, turnaround, notes },
      });
      if (files.length) {
        const presigned = await api<FilePresignResponse[]>(`/admin/jobs/${job.id}/files/presign`, {
          method: "POST",
          body: {
            files: files.map((f) => ({ filename: f.name, content_type: f.type || "application/octet-stream", size_bytes: f.size })),
          },
        });
        await Promise.all(
          presigned.map(async (p, i) => {
            await uploadToPresignedUrl(p.upload_url, files[i]);
            await api(`/admin/jobs/${job.id}/files/${p.file_id}/complete`, { method: "POST" });
          })
        );
      }
      showToast(`Order ${job.ref} created for ${job.studio.name}`);
      onCreated();
      onClose();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not create order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border border-line bg-bgcard">
        <div className="p-9">
          <h3 className="mb-4 text-lg font-bold">Create new order</h3>
          <div className="mb-4">
            <label className="field-label">Client studio</label>
            <select value={studioId} onChange={(e) => setStudioId(e.target.value)} className="field-input">
              {studios.length === 0 && <option value="">No studios yet</option>}
              {studios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="field-label">Job name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Boudoir — Mrs H, 21 Aug" className="field-input" />
          </div>
          <div className="mb-4">
            <label className="field-label">Edit specification</label>
            <select value={spec} onChange={(e) => setSpec(e.target.value)} className="field-input">
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="field-label">Turnaround</label>
            <select value={turnaround} onChange={(e) => setTurnaround(e.target.value)} className="field-input">
              {TURNAROUNDS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="field-label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="field-input resize-y" placeholder="Internal notes for this order…" />
          </div>
          <div className="mb-2">
            <label className="field-label">Session files</label>
            <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-ghost w-full">
              Choose files
            </button>
            <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])} />
            {files.length > 0 && (
              <div className="mt-3 flex max-h-40 flex-col gap-2 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-linesoft bg-bgraise p-2">
                    <div className="min-w-0 flex-1 truncate text-[13px]">{f.name}</div>
                    <div className="text-xs text-inkdim">{(f.size / 1048576).toFixed(1)} MB</div>
                    <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="px-1 text-inkdim hover:text-red">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-9 pb-8">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-gold" disabled={submitting} onClick={submit}>
            Create order
          </button>
        </div>
      </div>
    </div>
  );
}
