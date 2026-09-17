"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AdminJobOut, FileOut } from "@/lib/types";

export default function JobDetailModal({
  job,
  onClose,
}: {
  job: AdminJobOut | null;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<FileOut[] | null>(null);

  useEffect(() => {
    if (!job) return;
    setFiles(null);
    api<AdminJobOut & { files: FileOut[] }>(`/admin/jobs/${job.id}`)
      .then((detail) => setFiles(detail.files))
      .catch(() => setFiles([]));
  }, [job]);

  if (!job) return null;

  async function download(fileId: string) {
    if (!job) return;
    try {
      const res = await api<{ download_url: string }>(`/admin/jobs/${job.id}/files/${fileId}/download`);
      window.open(res.download_url, "_blank");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-2xl border border-line bg-bgcard">
        <div className="p-9">
          <h3 className="mb-4 text-lg font-bold">
            {job.name} · Ref {job.ref}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div>
              <div className="mb-1 text-[10.5px] uppercase tracking-wide text-inkdim">Studio</div>
              <div>{job.studio.name}</div>
            </div>
            <div>
              <div className="mb-1 text-[10.5px] uppercase tracking-wide text-inkdim">Edit specification</div>
              <div>{job.spec}</div>
            </div>
            <div>
              <div className="mb-1 text-[10.5px] uppercase tracking-wide text-inkdim">Turnaround</div>
              <div>{job.turnaround}</div>
            </div>
            <div>
              <div className="mb-1 text-[10.5px] uppercase tracking-wide text-inkdim">Submitted</div>
              <div>{new Date(job.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>
          <div className="mt-5">
            <div className="field-label">Notes from studio</div>
            <div className="min-h-[20px] rounded-[10px] border border-line bg-bgraise p-3.5 text-sm text-inkmid">
              {job.notes || "No notes provided."}
            </div>
          </div>
          <div className="mt-5">
            <div className="field-label">Session files</div>
            <div className="flex max-h-72 flex-col gap-2.5 overflow-y-auto">
              {files === null && <div className="text-sm text-inkdim">Loading…</div>}
              {files && files.length === 0 && <div className="text-sm text-inkdim">No files on this job.</div>}
              {files?.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-xl border border-linesoft bg-bgraise p-2">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-bgcard text-[10px] text-inkdim">
                    {f.uploaded ? "FILE" : "…"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px]">{f.filename}</div>
                    <div className="text-xs text-inkdim">{(f.size_bytes / 1048576).toFixed(1)} MB</div>
                  </div>
                  <button
                    disabled={!f.uploaded}
                    onClick={() => download(f.id)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-inkmid hover:border-gold hover:bg-golddim disabled:cursor-not-allowed disabled:text-inkdim disabled:hover:border-line disabled:hover:bg-transparent"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end px-9 pb-8">
          <button className="btn btn-gold" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
