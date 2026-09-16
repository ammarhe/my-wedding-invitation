# Wedding Invitation — عمار & سنا

A self-hosted, fully customisable Arabic wedding-invitation website that reproduces the
"minimalism dark red" design of the reference invitation, plus an admin dashboard to manage
every piece of content, guest wishes, photos and background music.

```
wedding-invitation/
├─ client/      React 18 + Vite  — the invitation (/) and the dashboard (/admin)
├─ server/      Express + SQLite (built-in node:sqlite) — content, wishes, uploads, auth
├─ scripts/     fetch-assets.sh — grabs the full-res artwork + original track
├─ Dockerfile, docker-compose.yml
└─ package.json root scripts (setup / dev / build / start)
```

## Requirements

Node.js **22.13 or newer** (uses the built-in `node:sqlite`, no native modules to compile).
Check with `node -v`.

## Run it locally

```bash
cd wedding-invitation
npm install            # installs "concurrently" for the dev script
npm run setup          # installs server + client dependencies
npm run dev            # API on http://localhost:4000, site on http://localhost:5173
```

Open <http://localhost:5173> for the invitation and <http://localhost:5173/admin> for the dashboard.
Default password is `change-me` — change it in `server/.env`.

### Production build

```bash
npm run build          # builds client/dist
npm start              # serves site + API + dashboard on http://localhost:4000
```

The server serves the built client itself, so a single port is enough. Put it behind
nginx/Caddy with HTTPS and set `COOKIE_SECURE=true` in `server/.env`.

### Docker

```bash
ADMIN_PASSWORD='a-strong-password' SESSION_SECRET="$(openssl rand -hex 32)" docker compose up -d --build
```

Uploads and the database persist in the `wedding-data` volume.

## Configuration (`server/.env`)

| Variable            | Default                          | Meaning                                   |
| ------------------- | -------------------------------- | ----------------------------------------- |
| `PORT`              | `4000`                           | HTTP port                                 |
| `ADMIN_PASSWORD`    | `change-me`                      | Dashboard password                        |
| `SESSION_SECRET`    | *(dev value)*                    | Signs the login cookie — use a long random string |
| `SESSION_TTL_HOURS` | `168`                            | How long a dashboard login lasts          |
| `COOKIE_SECURE`     | `false`                          | Set `true` when served over HTTPS         |
| `DATA_DIR`          | `server/data`                    | SQLite DB + uploads location              |
| `MAX_IMAGE_MB` / `MAX_AUDIO_MB` | `15` / `30`          | Upload limits                             |

## The dashboard (`/admin`)

* **Overview** – page opens, wishes count, share links. Add a guest name to get a personalised
  link (`/?to=اسم الضيف`) that shows *إلى: اسم الضيف* on the cover; one-click WhatsApp share.
* **Couple & names** – names, parents, announcement, page title / sharing description.
* **Event & venue** – date, times, time zone, labels, Google Maps query or custom embed URL,
  countdown & month-calendar toggles. "Add to calendar" produces a Google Calendar link and an `.ics` file.
* **Cover, guestbook, footer** – opening screen texts, auto-scroll after فتح (speed + delay; stops when the guest touches the page), guestbook labels, approval mode,
  🪄 suggested wishes, closing text.
* **Colors & style** – four theme colors (with presets), paper texture, castle background, flowers.
* **Photos** – upload photos, choose the envelope/cover photo, order the gallery
  (tapping the envelope photo on the invitation opens a lightbox gallery).
* **Music** – upload an MP3/M4A or paste a URL, autoplay/loop/volume. Music starts when the guest
  presses **فتح** on the cover (browsers require a tap before sound); a floating button pauses/resumes it.
* **Wishes** – approve, hide, delete, export CSV.

Everything you change shows instantly in the phone preview on the right; press **Save changes**
(or ⌘/Ctrl+S) to publish it to guests.

## Theme artwork

`client/public/theme/` contains compressed copies of the envelope, paper textures and couple photo.
The flower decoration and castle illustration could not be transferred automatically. Run once,
from the project root, on your Mac:

```bash
bash scripts/fetch-assets.sh
```

This downloads the full-resolution artwork (including `flower2-decoration.webp` and
`castle-background.webp`) and the original background track to `client/public/theme/music.mp3`.
Then in the dashboard → Music, paste `/theme/music.mp3` as the audio URL (or upload your own song).

You can replace any file in `client/public/theme/` with your own artwork — keep the file names.

## API (for reference)

| Method | Path                         | Auth | Purpose                      |
| ------ | ---------------------------- | ---- | ---------------------------- |
| GET    | `/api/content`               | –    | Invitation content JSON      |
| GET    | `/api/wishes`                | –    | Approved wishes              |
| POST   | `/api/wishes`                | –    | Add a wish `{name, message}` |
| POST   | `/api/visit`                 | –    | Record a page open           |
| POST   | `/api/auth/login`            | –    | `{password}` → cookie        |
| PUT    | `/api/admin/content`         | ✔    | Merge-save content           |
| POST   | `/api/admin/content/reset`   | ✔    | Back to the template         |
| GET/PATCH/DELETE | `/api/admin/wishes[/:id]` | ✔ | Moderate wishes           |
| POST   | `/api/admin/upload/image`    | ✔    | multipart `file`             |
| POST   | `/api/admin/upload/audio`    | ✔    | multipart `file`             |
| GET/DELETE | `/api/admin/uploads[/:name]` | ✔ | Manage uploaded files      |
| GET    | `/api/admin/stats`           | ✔    | Visits / wishes summary      |

## Sharing with guests

Send guests the site URL (e.g. `https://your-domain.com/`). Open Graph tags are injected from the
live content, so WhatsApp/Facebook previews show the couple's names and photo. Personalised links:
`https://your-domain.com/?to=عائلة%20أبو%20أحمد` (the dashboard builds these for you).
