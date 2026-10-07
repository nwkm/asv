# ASV — association management

Dashboard, participants, donations, calendar, courses and services (work periods) for an association.
UI in French and English; dates are always `DD/MM/YYYY`.

| Layer   | Tech                                                                           |
| ------- | ------------------------------------------------------------------------------ |
| Web     | Next.js (App Router) + Tailwind CSS v4 + next-intl                             |
| API     | NestJS on Bun                                                                  |
| Auth    | better-auth (mounted at `/api/auth` in the API) with role-based access control |
| Data    | PostgreSQL 17 + Drizzle ORM                                                    |
| Tooling | Bun, oxlint, oxfmt, Docker Compose                                             |

```
apps/api        NestJS API + better-auth + seed script
apps/web        Next.js frontend (proxies /api/* to the API so cookies stay first-party)
packages/db     Drizzle schema, migrations, mock-data seed
packages/shared zod schemas, enums, RBAC statements shared by API and web
```

## Quickstart (Docker)

```bash
cp .env.example .env          # set BETTER_AUTH_SECRET (openssl rand -base64 32) and SEED_PASSWORD
docker compose up --build     # db -> migrate (+ seed on an empty DB) -> api -> web
```

Open <http://localhost:3000>.

## Default mock credentials

The seed creates three accounts, all sharing one password:

| Role   | Email              | Default password | Access                                                            |
| ------ | ------------------ | ---------------- | ----------------------------------------------------------------- |
| admin  | `admin@asv.local`  | `ChangeMe123!`   | everything, plus user management (**Users** page)                 |
| staff  | `staff@asv.local`  | `ChangeMe123!`   | create / edit / delete participants, donations, courses, services |
| viewer | `viewer@asv.local` | `ChangeMe123!`   | read-only; create/edit/delete buttons are hidden, API returns 403 |

- The password comes from `SEED_PASSWORD` (`.env.example`, `compose.yaml` and `apps/api/src/seed.ts` all default to `ChangeMe123!`). If you set a different value in `.env` before the first seed, use that instead.
- The seed only runs on an **empty** database, and existing users are never modified, so changing `SEED_PASSWORD` later does not update existing accounts. To change them, delete the users (e.g. `docker compose down -v` for a fresh volume) and reseed, or create new users under **Users** (the Users page can create users and change roles/disable them, but not reset passwords).
- Verified on a fresh seed: all three accounts exist with the roles above and sign in with `ChangeMe123!`.
- **These are development credentials.** For any real deployment set `SEED=false` (or a strong `SEED_PASSWORD`) and create real users under **Users**. Public sign-up is disabled.

## Local development

```bash
bun install
bun run db:up                 # Postgres only (compose.dev.yaml)
bun run db:migrate && bun run db:seed
bun run dev                   # API :4000 + web :3000
```

`bun run db:seed -- --reset` wipes domain data and reseeds. Change the schema in `packages/db/src/schema.ts`, then `bun run db:generate`.

## Quality

```bash
bun run lint && bun run fmt:check && bun run typecheck && bun run test
```

API tests (`apps/api/test`) run against a throwaway `asv_test` database on the dev Postgres, so `bun run db:up` first.

## Roles

Access roles (`admin`, `staff`, `viewer`) live in `packages/shared/src/permissions.ts` and are enforced by the API (`AccessGuard` + `@RequirePermission`) and mirrored in the UI to hide actions. They are independent of the association roles (President, Treasurer, …) stored on participants; "Received by" lists participants whose association role is not `other`.
