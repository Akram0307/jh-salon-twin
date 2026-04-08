# ⚠️ ARCHIVED — Legacy Client PWA (Vite + React 18)

> **📦 This folder is archived.** The active codebase has moved to `frontend-next/`.

---

## Status
- ✅ **Archived:** 2026-04-08 (Sprint 2 Completion)
- 🚫 **No longer deployed** — CI workflow `deploy-client-pwa.yml` has been disabled
- 🚫 **No longer maintained** — do not add features or fix bugs here
- 🗑️ **Pending deletion** — will be removed in a future cleanup PR

## Migration

| Legacy Location | New Location |
|-----------------|--------------|
| `frontend/` (this folder) | `frontend-next/` |
| Vite + React 18 | Next.js 14 App Router |
| `/client/booking` route | `frontend-next/src/app/(client)/booking/page.tsx` |

### Active Client PWA
All client-facing features are now built in **`frontend-next/`** using Next.js 14 App Router:
- Client booking flow: `/client/booking`
- Service selection → time slot picking → confirmation
- Mobile-first responsive PWA

---

*Archived: 2026-04-08 | Sprint 2 Completion*
*Replaces: `frontend/DEPRECATED.md`*
