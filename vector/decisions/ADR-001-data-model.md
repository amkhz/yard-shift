# ADR-001: Initial Supabase Data Model

**Date:** 2026-03-13
**Status:** proposed
**Deciders:** Justin (operator), Signpost (planner)

## Plan: Supabase/Postgres Data Model for Yard Shift MVP

### Context

Yard Shift needs a relational data model before Workbench can build anything. The app's core loop is: host creates a sale, catalogs items, invites helpers, runs the sale (marking items sold), and reviews results. Supabase gives us Postgres with Row Level Security (RLS), auth, and real-time out of the box -- so the schema needs to be designed with RLS in mind from day one.

This is the foundation everything else sits on. Get it wrong and we're migrating tables mid-sprint. Get it right and the services layer (`services/supabase.js`) becomes a thin wrapper around well-scoped queries.

The data model is informed by:
- VECTOR.md's MVP scope (catalog, sale setup, sale day companion, payment tracking)
- The ship criteria (host auth, helper invites, real-time sync, summary stats)
- Supabase Auth conventions (the `auth.users` table is managed by Supabase; we reference it, never own it)

### Approach

**Five tables, two enums, RLS on everything.**

#### Tables

| Table | Purpose | Key relationships |
|-------|---------|-------------------|
| `profiles` | Public user data (display name). Synced from `auth.users` via trigger. | 1:1 with `auth.users` |
| `sales` | The yard sale event. Title, date, times, address, status. | Owned by a host (user). |
| `sale_members` | Join table linking users to sales with roles. | Many-to-many: users <-> sales. Drives all RLS. |
| `items` | Things for sale. Name, price, category, quantity, photo, sold status. | Belongs to a sale. Optionally tracks who sold it. |
| `categories` | Lookup table for item categories. | Referenced by items. |

#### Enums

| Enum | Values | Why an enum |
|------|--------|-------------|
| `sale_status` | `draft`, `active`, `completed` | Fixed set, unlikely to change. Postgres enum is faster than a string check and self-documenting. |
| `member_role` | `host`, `helper` | Two roles, period. If we ever add more (e.g., "viewer"), we alter the enum. |
| `invite_status` | `pending`, `accepted` | Tracks whether a helper has claimed their invite. |

#### Why a `profiles` table instead of querying `auth.users` directly?

Supabase's `auth.users` lives in the `auth` schema, which is not accessible via the client API and should not be exposed. A `profiles` table in the `public` schema gives us a place to store display names and any future user preferences, and it can be read by other users (e.g., showing "Sold by Mom" on an item). A trigger auto-creates a profile row when a user signs up.

#### Why a `categories` lookup table instead of a Postgres enum?

Categories are user-facing labels that Justin may want to add, rename, or reorder without a schema migration. A lookup table lets the UI fetch categories dynamically and lets us seed a default set. If we used an enum, every new category would require `ALTER TYPE` -- not worth the rigidity for display-only data.

#### Why `sale_members` as the RLS backbone?

Every RLS policy asks the same question: "Is this user a member of the sale this row belongs to?" By centralizing membership in `sale_members`, all policies follow the same pattern:
- Can see items? Check `sale_members`.
- Can update a sale? Check `sale_members` where role = `host`.
- Can mark an item sold? Check `sale_members`.

This is simple, auditable, and performs well with an index on `(sale_id, user_id)`.

#### Summary stats are queries, not columns

Total items, items sold, total revenue -- these are derived from `items` with simple aggregates. No denormalized counters. At yard-sale scale (tens to low hundreds of items), this is instant. If performance ever matters, we add a materialized view -- but that's a bridge we won't need to cross.

### Files affected

| Layer | File | Action |
|-------|------|--------|
| Services (schema) | `vector/schemas/001-initial-schema.sql` | New -- the migration file |
| Decisions | `vector/decisions/ADR-001-data-model.md` | New -- this document |

No application code is affected. This is planning and schema work only. Workbench will consume this schema when building the services layer.

### Open questions

1. **Item photos -- Supabase Storage bucket or external URL?** The schema stores a `photo_url` string, which works for both. The storage bucket setup is a separate concern (and a separate ADR if needed). For now, the column is nullable and format-agnostic.

2. **"Who contributed which items" -- is that MVP?** VECTOR.md flags this as an open question. The current schema tracks `sold_by` (which helper rang it up) but not "whose stuff is this." We can add a `contributed_by` column later without breaking anything. Leaving it out for now keeps the model lean.

3. **Should helpers be able to add items, or only the host?** The RLS policies currently allow any sale member to insert items. If Justin wants to restrict item creation to hosts only, that's a one-line policy change. Starting permissive feels right for the "family running a sale together" vibe.

4. **Magic link invite flow -- how does `sale_members` get populated?** The schema has the `pending`/`accepted` invite status, but the actual invite mechanism (generating a link, handling the callback, creating the `sale_members` row) is a services-layer concern. Signpost recommends a separate ADR for the invite flow once Workbench is ready to build auth.

5. **Soft delete or hard delete for items/sales?** Current schema uses hard deletes. If we want "undo" or post-sale history, we'd add a `deleted_at` timestamp. Keeping it simple for MVP.

### Definition of done

- [ ] SQL migration file runs cleanly in a fresh Supabase project's SQL editor
- [ ] All five tables are created with correct types and constraints
- [ ] RLS is enabled on all tables with policies that scope access to sale members
- [ ] Indexes exist on foreign keys and common query patterns
- [ ] Categories table is seeded with a sensible default set
- [ ] A trigger auto-creates a `profiles` row on user signup
- [ ] The migration is idempotent-safe (uses `IF NOT EXISTS` or `CREATE OR REPLACE` where possible)

## Decision

Adopt the five-table model described above as the initial Supabase schema. Run it as a single migration (`001-initial-schema.sql`) in the Supabase SQL editor. All application code will be built against this schema.

## Consequences

**Positive:**
- Clean relational model that maps directly to the app's domain concepts
- RLS policies scoped through `sale_members` make security auditable and consistent
- Categories as a lookup table give Justin flexibility to customize without migrations
- Schema is simple enough that Workbench can build the services layer quickly
- Profiles trigger means auth "just works" -- no manual profile creation step

**Negative:**
- No soft deletes means accidental deletions are permanent (acceptable for MVP)
- No `contributed_by` tracking means multi-family item attribution isn't supported yet
- The `profiles` trigger adds a small amount of magic -- new developers need to know it exists
- Summary stats as queries (not cached) could be slow at scale -- but yard sales are not scale problems

## Alternatives Considered

1. **Single `users` table instead of `profiles` + `auth.users`:** Rejected because Supabase manages `auth.users` internally. Duplicating auth fields in our own table creates sync problems. A thin `profiles` table is the documented Supabase pattern.

2. **Categories as a Postgres enum:** Rejected because adding categories would require schema migrations. A lookup table is more flexible for user-facing labels.

3. **Denormalized counters for sale stats:** Rejected because the item counts are trivially computed at yard-sale scale. Counters add complexity (keeping them in sync) without meaningful performance benefit.

4. **JSONB columns for flexible item metadata:** Rejected because the item model is well-defined. Structured columns give us type safety, indexing, and validation. JSONB would be over-engineering flexibility we don't need.
