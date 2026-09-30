# Streamly

A full-stack video platform: browse and search videos, watch with a custom HTML5 player, comment, like, subscribe, build playlists, upload your own videos and track them in a creator studio.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui**, **PostgreSQL + Prisma 7**, **Auth.js v5** and **Lucide** icons.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

That's all. On the first run `npm run dev`:

1. creates `.env` from `.env.example` with a fresh `AUTH_SECRET`,
2. starts a **local PostgreSQL** server from the `embedded-postgres` package (data in `.data/postgres`; no Docker or system install needed),
3. applies the Prisma migrations,
4. seeds demo data if the database is empty,
5. starts Next.js.

**Demo account:** `demo@streamly.dev` / `streamly123` (there's also a one-click button on the sign-in page in development). Every seeded channel uses the same password, e.g. `lumenstudios@streamly.dev`.

Requirements: Node.js 20.9+ (tested on Node 24, Windows 10).

### Using your own PostgreSQL

Set in `.env`:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/streamly"
USE_EMBEDDED_POSTGRES="false"
```

`npm run dev` will then only run migrations (and seed an empty database) against that server.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Database + migrations + first-run seed + Next.js dev server |
| `npm run build` | `prisma generate` and a production build |
| `npm start` | Database + migrations + `next start` (run `build` first) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:migrate -- --name <name>` | Create and apply a new migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Wipe and re-seed demo data |
| `npm run db:reset` | Drop everything, re-apply migrations, re-seed |
| `npm run db:studio` | Prisma Studio (database browser) |
| `npm run db:up` | Just start the local database and keep it running |

### Migrations

- Schema lives in `prisma/schema.prisma`; migrations in `prisma/migrations`.
- Change the schema, then `npm run db:migrate -- --name describe_change`.
- In production run `npx prisma migrate deploy` (done automatically by `npm start` via `scripts/with-db.mjs`).

---

## Features

**Viewing** – home feed with topic chips, a Shorts shelf and infinite scroll · Explore (trending, by topic) · watch page with a custom player (play/pause, volume, seek with preview time, speed, picture-in-picture, fullscreen, keyboard shortcuts `k j l m f i ←→↑↓`), resume where you left off, playlist queue with auto-advance · recommended videos (right on desktop, below the player on mobile).

**Search** – ranked search over titles, descriptions, channel names and tags · filters (upload date, duration, type: videos/Shorts/channels) and sort (relevance, date, views) · pagination and an empty state.

**Channels** – banner, avatar, @handle, subscriber count, subscribe, bio and links · tabs: Videos (sortable, infinite scroll), Shorts, Playlists, About.

**Accounts** – register, sign in, sign out, bcrypt password hashing, JWT sessions (Auth.js), protected routes, profile editing (avatar, banner, name, username, bio, location, links; users can only edit their own).

**Interactions** – like/dislike, subscribe/unsubscribe, Watch later, automatic watch history (`/history`), liked videos (`/liked`), subscriptions feed (`/subscriptions`), library overview (`/library`), comments with replies, comment likes and deleting your own comments.

**Playlists** – create, edit, delete, add/remove videos (from any video's ⋮ menu or the watch page), public/unlisted/private, play all and shuffle.

**Upload** – drag and drop, client + server validation (type, size, file signature, required fields), duration detection, thumbnail picked from auto-captured frames or uploaded, tags, category, visibility, upload progress with cancel; redirects to the new video.

**Studio** – totals (views, subscribers, videos, watch time), 28-day views and watch-time charts, recent and top videos, a management table (thumbnail, title, visibility, views, likes, comments, date, edit, delete) and an edit page (title, description, thumbnail, tags, category, visibility).

**Notifications** – new subscriber, comment on your video, reply to your comment, like on your video; bell dropdown with unread badge.

**UI** – light and dark themes (persisted), responsive layout (sidebar → icon rail → drawer + bottom nav), skeletons, empty states, error boundaries, 404 pages, toasts, confirmation dialogs.

**SEO** – per-page titles and descriptions, Open Graph/Twitter tags, dynamic metadata for videos and channels, `VideoObject` JSON-LD, `sitemap.xml` and `robots.txt`.

---

## Project structure

```
prisma/
  schema.prisma          data model
  migrations/            SQL migrations
  seed.ts                demo data
scripts/with-db.mjs      starts local Postgres, migrates, seeds, then runs a command
src/
  app/
    (main)/              pages inside the app shell (home, watch, search, channel, studio, …)
    (auth)/              login and register
    api/                 REST endpoints: auth, upload, media, videos feed, view tracking
  components/            UI, grouped by feature (layout, video, watch, channel, studio, …)
    ui/                  shadcn/ui primitives
  hooks/                 client hooks (infinite feed)
  lib/                   formatting, constants, zod validation (shared by client and server)
  server/
    actions/             server actions (mutations), all validated and authorized
    queries/             read-side data access
    storage/             storage drivers: local (implemented), s3 and cloudinary (stubs)
    auth.ts, session.ts  Auth.js config and session helpers
  types/                 shared types
  proxy.ts               redirects signed-out visitors away from private pages
```

---

## Video storage

All file handling goes through `src/server/storage`:

```ts
interface StorageDriver {
  save(input): Promise<{ key; url }>;
  delete(key): Promise<void>;
  publicUrl(key): string;
}
```

- **local** (default) writes to `LOCAL_STORAGE_DIR` and serves files from `/api/media/*` with HTTP range support for seeking.
- **s3** and **cloudinary** are isolated stubs (`s3.ts`, `cloudinary.ts`) that document exactly where to add the SDK calls and credentials. Set `STORAGE_DRIVER` and the matching variables in `.env`; nothing else in the app changes, because videos store the returned key and URL.

Seeded videos point to public sample files (Blender Foundation open movies under CC BY, plus W3C, MDN and Video.js test clips), so demo titles don't always match what plays. Thumbnails come from picsum.photos and avatars from pravatar.cc; these need an internet connection.

---

## Security notes

- Passwords hashed with bcrypt (cost 12); unknown emails still run a hash compare to avoid timing leaks.
- Every server action and API route checks the session and ownership on the server; client checks are only for UX.
- All input validated with zod on the server; user text is sanitized and rendered as text (never as HTML).
- Uploads are checked for MIME type, size and file signature (magic bytes); storage keys are random UUIDs and path traversal is blocked.
- Unique constraints make duplicate likes, subscriptions and saves impossible.
- Private videos and playlists are only visible to their owner; unlisted ones are hidden from feeds and search.
- Prisma parameterizes all queries; the one raw search query uses bound parameters via `Prisma.sql`.

**Known limitation:** locally stored files are served by unguessable random URLs but not access-checked per request, so someone who obtains a private video's file URL could download it. With S3 or Cloudinary, use signed URLs for private videos.

---

## Deploying

1. Provision PostgreSQL and set `DATABASE_URL`, `USE_EMBEDDED_POSTGRES=false`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`.
2. Configure a cloud `STORAGE_DRIVER` (local disk doesn't persist on most hosts).
3. `npm run build`, then `npx prisma migrate deploy` and `npm start` (or your platform's equivalent).
