# Deploying the backend to a Linode VM

Two options are included — pick one.

## Option A: Docker (recommended)

1. `ssh` into the Linode VM, install Docker.
2. `git clone` this repo, `cd backend`.
3. Copy `.env.example` to `.env` and fill in real values (DB, B2, Postmark, and `CORS_ORIGINS` with your Vercel domain).
4. `docker compose -f deploy/docker-compose.yml up -d --build`
5. API now listens on `127.0.0.1:8000` on the VM only — point nginx at it (see below).

## Option B: systemd + venv (no Docker)

1. `sudo useradd -r -s /bin/false leadflow` (or any dedicated user).
2. Put the repo at `/srv/leadflow`, `cd /srv/leadflow/backend`.
3. `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`
4. Copy `.env.example` to `.env`, fill in real values, `chmod 600 .env`.
5. `sudo cp deploy/leadflow-api.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now leadflow-api`

## Nginx + TLS (both options)

1. `sudo cp deploy/nginx.conf /etc/nginx/sites-available/leadflow-api`, edit `server_name` to your real subdomain (e.g. `api.leadflow.co`), then `sudo ln -s /etc/nginx/sites-available/leadflow-api /etc/nginx/sites-enabled/`.
2. `sudo nginx -t && sudo systemctl reload nginx`
3. `sudo certbot --nginx -d api.leadflow.co` for free TLS — certbot rewrites the config to add the HTTPS block and redirect.

## After it's live

- Point the Vercel frontend's `NEXT_PUBLIC_API_BASE` env var at `https://api.leadflow.co`.
- Add that same Vercel URL to the backend's `CORS_ORIGINS` env var and restart the service (`docker compose restart` or `systemctl restart leadflow-api`).
- Run migrations once on the new box if this is a fresh deploy pointing at a fresh DB: `.venv/bin/alembic upgrade head` (or `docker compose exec api alembic upgrade head`). If you're pointing at the *same* Neon database the Render deploy already used, migrations are already applied — skip this.
- DB (Neon), B2, and Postmark are already cloud services — nothing to move for those regardless of which VM runs the API.
