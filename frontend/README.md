# Lead Flow — Next.js frontend

Next.js 14 (App Router) + TypeScript + Tailwind port of the studio/admin portal. Talks to the existing FastAPI
backend over HTTP — no backend code changes required to run this.

## Local development

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE to your backend URL
npm run dev
```

Runs at `http://localhost:3000`. Point `NEXT_PUBLIC_API_BASE` at your local backend (e.g.
`http://127.0.0.1:8000`) or the live Render/Linode API.

## Deploying to Vercel

1. Push this repo to GitHub (the `frontend/` folder can be the Vercel project root — set **Root Directory**
   to `frontend` in the Vercel project settings if the repo root has other folders like `backend/`).
2. In Vercel → Project → Settings → Environment Variables, add:
   - `NEXT_PUBLIC_API_BASE` = your backend's public URL (e.g. `https://api.leadflow.co`)
3. Deploy. Vercel auto-detects Next.js — no build command changes needed.
4. Once you have the Vercel URL (e.g. `https://leadflow.vercel.app`), add it to the backend's `CORS_ORIGINS`
   env var and restart the backend — otherwise the browser will block API requests from the new domain.

## What's included

- Studio portal: new-job upload (direct-to-B2 via presigned URLs), jobs list (current + completed), invoice
  viewing, PDF download.
- Admin panel: Dashboard, All Orders, Clients, Invoices, Analytics, New Order (with file upload), Send Invoice
  form, job detail modal, notification bell (new orders / new signups).
- Auth: sign in, sign up, email-confirm link, set password — mirrors the existing backend flow exactly.
- Responsive: sidebar collapses to a toggled menu on mobile, grids drop to single/two columns below `sm`/`lg`
  breakpoints, topbars wrap instead of overflowing.

## What's NOT done here

- The old `backend/app/templates/portal.html` (served by FastAPI at `/`) is untouched and still works — this
  is a parallel frontend, not a replacement in the backend repo. Once you're happy with this Next.js app in
  production, you can remove the Jinja2 route and template from the backend.
- No automated tests were added (none existed in the original either).
- Visual parity is close but not pixel-perfect — this was an explicit Tailwind rebuild rather than a literal
  CSS port, per your choice during scoping.
