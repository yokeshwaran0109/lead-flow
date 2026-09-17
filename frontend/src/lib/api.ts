const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export class ApiError extends Error {}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("lf_token");
  } catch {
    return null;
  }
}

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let body: string | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body,
  });
  if (!res.ok) {
    let detail = "Request failed";
    try {
      const j = await res.json();
      detail = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* ignore */
    }
    throw new ApiError(detail);
  }
  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export async function uploadToPresignedUrl(url: string, file: File): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!res.ok) throw new ApiError("Upload failed");
}

export { API_BASE };
