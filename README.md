# vue-upload-form

NPI login form (eSignet + OTP) for ANIP eServices.

## Environment variables

Copy `.env.example` to `.env` and fill in real values:

| Variable | Purpose |
|---|---|
| `VITE_ESIGNET_CLIENT_ID` | eSignet OIDC client id |
| `VITE_ESIGNET_REDIRECT_URI` | Must match the redirect URI registered with eSignet, and must point at wherever this app is actually served |
| `VITE_ESIGNET_AUTHORIZE_URI` | eSignet `/authorize` endpoint |
| `VITE_ESIGNET_SCOPE` | OIDC scopes, e.g. `openid profile` |
| `VITE_ESIGNET_ACR_VALUES` | Optional ACR values |

These are Vite `VITE_*` vars, so they're **baked into the JS bundle at build time**. Changing `.env` requires a rebuild, not just a restart.

Before showing the eSignet button, the app calls `/api/auth/esignet/prepare` to get a server-issued `state`/`nonce` pair (see [`src/config/oidc.ts`](src/config/oidc.ts)). That path is proxied (both in dev and in Docker) to a backend running on `http://localhost:3000` — no env var needed for local dev, see [Backend proxy](#backend-proxy) below.

## Local development (no Docker)

```bash
npm install
npm run dev
```

Serves on `http://127.0.0.1:5173`. Requires a backend listening on `http://localhost:3000` (proxied via `vite.config.js`).

## Docker

Build and run:

```bash
docker compose up -d --build
```

App is served at **http://127.0.0.1:5174** (see `ports:` in `docker-compose.yml`).

```bash
docker compose logs -f   # view logs
docker compose down      # stop
```

Rebuild after any change to `.env` or source code — `--build` is required, a plain restart won't pick up new `VITE_*` values:

```bash
docker compose up -d --build
```

⚠️ `VITE_ESIGNET_REDIRECT_URI` must exactly match the redirect URI registered with your eSignet client. It currently points directly at the backend (`http://127.0.0.1:3000/api/callback`), since the backend — not this frontend — exchanges the OAuth code server-side.

### Backend proxy

The container's nginx proxies `/api/*` to `http://host.docker.internal:3000/*`, i.e. a backend running on the **host** machine (outside Docker) on port 3000. This keeps the browser talking same-origin to `:5174` and avoids CORS. `docker-compose.yml` sets `extra_hosts: host.docker.internal:host-gateway` so the container can resolve the host on Linux.

If the backend moves (different port, or containerized itself), update the `proxy_pass` target in `nginx.conf` (and the dev proxy in `vite.config.js`) accordingly.

## Deploying to Render

Render deployment uses **`prod.Dockerfile`**, not the local `Dockerfile` — the difference is how the backend proxy target is configured: locally it's hardcoded to `host.docker.internal:3000`, but Render has no such host gateway, so `prod.Dockerfile` reads it from a runtime env var (`BACKEND_ORIGIN`) instead, substituted into nginx's config at container startup via [`nginx.conf.template`](nginx.conf.template).

The backend is already deployed at `https://esignet-backend.onrender.com`, and `render.yaml` sets `BACKEND_ORIGIN` to that URL directly (its public HTTPS endpoint, not Render's internal private networking — that's only usable if both services share the same Render account/region, which isn't assumed here).

1. In the Render dashboard: "New" > "Blueprint", pointing at this repo. It picks up [`render.yaml`](render.yaml) and creates the `vue-upload-form` Web Service using `prod.Dockerfile`.
2. Render will prompt for the `VITE_*` values (marked `sync: false` in the Blueprint, i.e. not committed to the repo) — same values as your `.env`. Render forwards these to the Docker build automatically (matched against the `ARG`s in `prod.Dockerfile`), so they get baked into the JS bundle.
3. Deploy. Render detects the exposed port from `prod.Dockerfile`'s `EXPOSE 80`.

If configuring the service manually instead of via the Blueprint: set the runtime to **Docker**, **Dockerfile Path** to `prod.Dockerfile`, and add `BACKEND_ORIGIN=https://esignet-backend.onrender.com` alongside the `VITE_*` vars.

⚠️ nginx resolves `BACKEND_ORIGIN`'s hostname once, at container startup. If the backend moves to a different URL later, this frontend service needs a restart (or redeploy) to pick up the change.

## Files

- `Dockerfile` — local Docker Compose build: `node:20-alpine` builds the static site, `nginx:1.27-alpine` serves it, backend reached via `host.docker.internal`
- `prod.Dockerfile` — Render build: same build stage, but the backend proxy target comes from the `BACKEND_ORIGIN` runtime env var instead
- `nginx.conf` — static file serving, SPA fallback (`/callback` etc. resolve to `index.html`), `/api` reverse proxy to `host.docker.internal:3000` (used by `Dockerfile`)
- `nginx.conf.template` — same as `nginx.conf`, but with `${BACKEND_ORIGIN}` in place of the hardcoded host (used by `prod.Dockerfile`, rendered via `envsubst` at container startup)
- `docker-compose.yml` — build args for `VITE_*` vars, port mapping, host networking for the backend proxy
- `render.yaml` — Render Blueprint for deploying via `prod.Dockerfile`
- `vite.config.js` — dev server `/api` proxy, mirrors the nginx proxy for local development
