export type Role = "studio" | "admin";

export const STAGES = [
  "Received",
  "In editing",
  "Quality check",
  "Delivered",
  "Invoice sent",
  "Invoice paid",
] as const;

export const SERVICES = [
  "Signature Boudoir — full retouch",
  "Colour & tone only",
  "Cull + colour + light retouch",
  "Fine art black & white conversion",
  "Album-ready master edit",
];

export interface Token {
  access_token: string;
  token_type: string;
  role: Role;
}

export interface StudioOut {
  id: string;
  email: string;
  name: string;
  location: string;
  plan: string;
}

export interface AdminOut {
  id: string;
  email: string;
  name: string;
}

export interface StudioSummary {
  id: string;
  email: string;
  name: string;
  location: string;
  plan: string;
  created_at: string;
  orders_count: number;
  files_total: number;
  revenue: number;
}

export interface InvoiceLine {
  description: string;
  qty: number | string;
  amount: number;
}

export interface InvoiceOut {
  id: string;
  invoice_number: string;
  lines: InvoiceLine[];
  total_amount: number;
  note: string;
  issued_at: string;
  paid: boolean;
  paid_at: string | null;
}

export interface JobOut {
  id: string;
  ref: string;
  name: string;
  spec: string;
  turnaround: string;
  notes: string;
  stage: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminJobOut extends JobOut {
  studio: StudioSummary;
  files_count: number;
  invoice: InvoiceOut | null;
}

export interface FileOut {
  id: string;
  filename: string;
  size_bytes: number;
  uploaded: boolean;
}

export interface FilePresignResponse {
  file_id: string;
  upload_url: string;
  storage_key: string;
}

export interface AnalyticsOut {
  revenue_this_month: number;
  revenue_last_month: number;
  avg_order_value: number;
  files_edited: number;
  avg_turnaround_hours: number;
  monthly_revenue: { month: string; total: number }[];
  service_breakdown: { spec: string; count: number; percent: number }[];
}
