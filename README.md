# NT Property Studio

Ionic Core 8 + Vite. Homepage for editing and exporting a property presentation.

## Run

npm install
Copy-Item .env.example .env
npm run dev

Open http://127.0.0.1:5173

## Login

The entry page (also available at `/login`) requires username and password. Successful login verifies the JWT with `/auth/me` before opening the studio. Logout clears the tab session. Passwords are never persisted; the token is kept in sessionStorage and verified again on reload. API authorization must also be enforced by the backend.

The local `.env` uses the same-origin `/profile-estate` path. Start the backend separately on port 3000; Vite proxies that path to `API_PROXY_TARGET`, which defaults to `http://localhost:3000`. To use another local backend, set `API_PROXY_TARGET` in `.env.local` and restart Vite. Production hosting must also route `/profile-estate` to the backend. No backend or demo login is included in this UI repository.

Requests follow `docs/profile_property.md`: `POST /auth/login` with `{ username, password }`, and `GET /auth/me` with `Authorization: Bearer <token>`. The backend currently returns `{ success: true, token, user }`; the adapter also accepts `{ success: true, data: { token } }`.

Public registration is intentionally omitted: the docs list login and current-user endpoints only, and `docs/database.md` does not define account provisioning. Contacting the administrator is the proposed account-access flow, not a documented provisioning API. Password recovery shows administrator guidance because no reset endpoint or support contact is specified.

Run `node scripts/check-login.mjs` with the dev server running to test login behavior against mocked API responses, including invalid credentials, network errors, session expiry, logout and responsive layouts.

## Validate

npm run build
npm test

Tests require the local dev server and Microsoft Edge. Screenshots and example exports are saved in artifacts/. Tests cover live editing, local draft persistence, image upload, themes, PNG/PPTX downloads and widths 360, 390, 768, 1024 and 1440.

## Design

Selected direction: NT Presentation Studio. Navy #142B49, yellow #FFC629, background #EEF2F6, white #FFFFFF, muted text #607087. Prompt headings and Sarabun details are bundled locally. Spacing scale: 4, 8, 12, 16, 24, 32, 48 px. Desktop uses an editor alongside the live slide; mobile uses Ionic segments with optional enlarged preview.

Alternative direction considered: Property Workspace, lighter blue #234E70 / #E8F1F8, vertically grouped form with a large property image.

## Scope

Drafts are stored only in this browser. Images and property details are samples. PowerPoint export uses editable text and shapes with embedded images. PNG export renders the slide at 2x resolution. The studio supports inline text editing, light/dark themes, zoom, expanded preview, printing, and Google Maps links. The sample slide includes nine property details plus selling points and limitations. AI polishing is disabled until an AI service is configured. Native iOS/Android packaging and physical-device testing are not included.

Ionic reference: https://ionicframework.com/docs/intro/cdn
