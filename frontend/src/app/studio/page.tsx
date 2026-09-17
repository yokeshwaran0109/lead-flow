"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, uploadToPresignedUrl } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { SERVICES } from "@/lib/types";
import type { FilePresignResponse, JobOut } from "@/lib/types";

const TURNAROUNDS = [
  { label: "Standard", hours: "72h" },
  { label: "Priority", hours: "48h" },
  { label: "Rush", hours: "24h" },
];

export default function NewJobPage() {
  const router = useRouter();
  const showToast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [jobName, setJobName] = useState("");
  const [spec, setSpec] = useState(SERVICES[0]);
  const [turnIdx, setTurnIdx] = useState(0);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  async function sendJob() {
    if (!files.length) return;
    setSending(true);
    const turnaround = `${TURNAROUNDS[turnIdx].label} · ${TURNAROUNDS[turnIdx].hours}`;
    try {
      const job = await api<JobOut>("/jobs", {
        method: "POST",
        body: { name: jobName.trim() || "Untitled shoot", spec, turnaround, notes },
      });
      const presigned = await api<FilePresignResponse[]>(`/jobs/${job.id}/files/presign`, {
        method: "POST",
        body: {
          files: files.map((f) => ({
            filename: f.name,
            content_type: f.type || "application/octet-stream",
            size_bytes: f.size,
          })),
        },
      });
      await Promise.all(
        presigned.map(async (p, i) => {
          await uploadToPresignedUrl(p.upload_url, files[i]);
          await api(`/jobs/${job.id}/files/${p.file_id}/complete`, { method: "POST" });
        })
      );
      showToast(`${files.length} file${files.length === 1 ? "" : "s"} submitted as ${jobName || "Untitled shoot"}`);
      setFiles([]);
      setJobName("");
      setNotes("");
      router.push("/studio/jobs");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not send job");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="card">
        <h3 className="text-base font-bold">Upload session files</h3>
        <div className="mb-5 mt-1 text-[13px] text-inkdim">Drag in RAWs or JPEGs, or browse your computer</div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging ? "border-gold bg-golddim" : "border-line hover:border-inkdim"
          }`}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bgraise">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 text-inkmid">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div className="font-semibold">Drop shoot files here</div>
          <div className="mt-1 text-[13px] text-inkdim">
            or <b className="text-inkmid">browse your computer</b> · up to 2,000 files per job
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />

        {files.length > 0 && (
          <div className="mt-5 flex max-h-72 flex-col gap-2.5 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-linesoft bg-bgraise p-2">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-bgcard text-[10px] text-inkdim">
                  {f.type.startsWith("image/") ? "" : "RAW"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px]">{f.name}</div>
                  <div className="text-xs text-inkdim">{(f.size / 1048576).toFixed(1)} MB</div>
                </div>
                <button
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="px-2 text-lg text-inkdim hover:text-red"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="mt-4 flex justify-between text-[13px] text-inkmid">
            <span>
              <b>{files.length}</b> files selected
            </span>
            <span>
              <b>{(totalSize / 1048576).toFixed(1)} MB</b> total
            </span>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-base font-bold">Job details</h3>
        <div className="mb-5 mt-1 text-[13px] text-inkdim">Tell Elyon how you want this shoot handled</div>

        <div className="mb-4">
          <label className="field-label">Job name</label>
          <input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="e.g. Boudoir — Mrs H, 21 Aug" className="field-input" />
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
          <div className="flex flex-wrap gap-2">
            {TURNAROUNDS.map((t, i) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setTurnIdx(i)}
                className={`rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  turnIdx === i ? "border-gold bg-golddim text-goldbright" : "border-line text-inkmid hover:border-inkdim"
                }`}
              >
                {t.label} <small className="text-inkdim">{t.hours}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="field-label">Notes for Elyon (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="field-input resize-y"
            placeholder="Any specific styling or delivery notes…"
          />
        </div>

        <button onClick={sendJob} disabled={!files.length || sending} className="btn btn-gold w-full">
          Send to Elyon
        </button>
      </div>
    </div>
  );
}
